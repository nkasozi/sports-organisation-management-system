import type { CalendarToken } from "$lib/core/entities/CalendarToken";
import {
  type CalendarTokenValue,
  parse_calendar_token_value,
} from "$lib/core/types/DomainScalars";
import {
  get_repository_container,
  get_use_cases_container,
} from "$lib/infrastructure/container";

import type { RequestHandler } from "./$types";
import {
  build_calendar_feed_ics_response,
  create_plain_text_response,
  load_calendar_feed_activities,
  resolve_calendar_organization_name,
  strip_calendar_token_extension,
} from "./calendarFeedBuilder";
import {
  CALENDAR_FEED_ACCESS_STATUS,
  CALENDAR_FEED_EVENTS,
  CALENDAR_FEED_HTTP_STATUS,
  CALENDAR_FEED_RESPONSE_MESSAGES,
} from "./calendarFeedConstants";
import { resolve_calendar_feed_token_access } from "./calendarFeedTokenAccess";

function record_calendar_feed_access(
  use_cases: ReturnType<typeof get_use_cases_container>,
  token: CalendarTokenValue,
  token_id: string,
): Promise<boolean> {
  return use_cases.calendar_token_use_cases
    .record_feed_access(token)
    .then((access_record_result) => {
      if (access_record_result.success) return true;
      console.warn("[Calendar] Feed access could not be recorded", {
        event: CALENDAR_FEED_EVENTS.ACCESS_RECORD_FAILED,
        token_id,
      });
      return false;
    });
}

async function build_granted_calendar_feed_response(
  calendar_token: CalendarToken,
): Promise<Response> {
  const repositories = get_repository_container();
  const organization_name = await resolve_calendar_organization_name(
    repositories,
    calendar_token,
  );
  const activities_result = await load_calendar_feed_activities(
    repositories,
    calendar_token,
  );
  if (!activities_result.success)
    return create_plain_text_response(
      activities_result.error,
      CALENDAR_FEED_HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  return build_calendar_feed_ics_response(
    calendar_token,
    activities_result.data,
    organization_name,
  );
}

export const GET: RequestHandler = async ({ params }) => {
  const token_result = parse_calendar_token_value(
    strip_calendar_token_extension(params.token),
  );
  if (!token_result.success)
    return create_plain_text_response(
      CALENDAR_FEED_RESPONSE_MESSAGES.INVALID_TOKEN,
      CALENDAR_FEED_HTTP_STATUS.BAD_REQUEST,
    );
  const use_cases = get_use_cases_container();
  const token_access = await resolve_calendar_feed_token_access(
    use_cases,
    token_result.data,
  );
  if (token_access.status === CALENDAR_FEED_ACCESS_STATUS.REJECTED)
    return token_access.response;
  await record_calendar_feed_access(
    use_cases,
    token_result.data,
    token_access.calendar_token.id,
  );
  return build_granted_calendar_feed_response(token_access.calendar_token);
};
