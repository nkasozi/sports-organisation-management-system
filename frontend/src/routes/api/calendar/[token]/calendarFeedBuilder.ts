import type { Activity } from "$lib/core/entities/Activity";
import {
  CALENDAR_FEED_TYPE,
  type CalendarToken,
  get_feed_type_display_name,
} from "$lib/core/entities/CalendarToken";
import {
  convert_activity_to_ical_event,
  generate_ical_feed,
  type ICalEvent,
  type ICalFeedConfig,
} from "$lib/core/services/ICalService";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { get_repository_container } from "$lib/infrastructure/container";

import {
  CALENDAR_FEED_EVENTS,
  CALENDAR_FEED_RESPONSE_MESSAGES,
} from "./calendarFeedConstants";

type CalendarFeedRepositories = ReturnType<typeof get_repository_container>;

const DEFAULT_CALENDAR_ORGANIZATION_NAME = "Sport-Sync";
const CALENDAR_FEED_TIMEZONE = "UTC";
const CALENDAR_FEED_PAGE_SIZE = 1000;
const YEAR_START_SUFFIX = "-01-01";
const YEAR_END_SUFFIX = "-12-31";
const PLAIN_TEXT_CONTENT_TYPE = "text/plain";
const ICS_FILE_EXTENSION_PATTERN = /\.ics$/;
const NON_ALPHANUMERIC_PATTERN = /[^a-zA-Z0-9]/g;

export function strip_calendar_token_extension(
  token_with_extension: string,
): string {
  return token_with_extension.replace(ICS_FILE_EXTENSION_PATTERN, "");
}

export function create_plain_text_response(
  message: string,
  status: number,
): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": PLAIN_TEXT_CONTENT_TYPE },
  });
}

export async function resolve_calendar_organization_name(
  repositories: CalendarFeedRepositories,
  calendar_token: CalendarToken,
): Promise<string> {
  const organization_result =
    await repositories.organization_repository.find_by_id(
      calendar_token.organization_id,
    );
  return organization_result.success && organization_result.data
    ? organization_result.data.name
    : DEFAULT_CALENDAR_ORGANIZATION_NAME;
}

function filter_activities_for_calendar_feed(
  activities: Activity[],
  calendar_token: CalendarToken,
): Activity[] {
  const calendar_entity_id = calendar_token.entity_id;
  if (calendar_entity_id === "") {
    return activities;
  }
  switch (calendar_token.feed_type) {
    case CALENDAR_FEED_TYPE.TEAM:
      return activities.filter((activity) =>
        activity.team_ids.includes(calendar_entity_id),
      );
    case CALENDAR_FEED_TYPE.COMPETITION:
      return activities.filter(
        (activity) => activity.competition_id === calendar_entity_id,
      );
    case CALENDAR_FEED_TYPE.ALL:
    case CALENDAR_FEED_TYPE.PLAYER:
      return activities;
  }
}

export async function load_calendar_feed_activities(
  repositories: CalendarFeedRepositories,
  calendar_token: CalendarToken,
): AsyncResult<Activity[]> {
  const current_year = new Date().getFullYear();
  const activities_result =
    await repositories.activity_repository.find_by_date_range(
      calendar_token.organization_id,
      `${current_year}${YEAR_START_SUFFIX}`,
      `${current_year}${YEAR_END_SUFFIX}`,
      { page_number: 1, page_size: CALENDAR_FEED_PAGE_SIZE },
    );
  if (!activities_result.success) {
    console.error("[Calendar] Failed to load feed activities", {
      event: CALENDAR_FEED_EVENTS.ACTIVITIES_LOAD_FAILED,
      token_id: calendar_token.id,
      organization_id: calendar_token.organization_id,
      error: activities_result.error,
    });
    return create_failure_result(
      CALENDAR_FEED_RESPONSE_MESSAGES.ACTIVITIES_UNAVAILABLE,
    );
  }
  return create_success_result(
    filter_activities_for_calendar_feed(
      activities_result.data.items,
      calendar_token,
    ),
  );
}

function build_calendar_feed_name(
  calendar_token: CalendarToken,
  organization_name: string,
): string {
  if (calendar_token.feed_type === CALENDAR_FEED_TYPE.ALL) {
    return `${organization_name} Calendar`;
  }
  const type_display = get_feed_type_display_name(calendar_token.feed_type);
  return calendar_token.entity_name
    ? `${calendar_token.entity_name} - ${type_display}`
    : `${organization_name} ${type_display}`;
}

function create_calendar_feed_response(
  ics_content: string,
  feed_name: string,
): Response {
  return new Response(ics_content, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${feed_name.replace(NON_ALPHANUMERIC_PATTERN, "_")}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export function build_calendar_feed_ics_response(
  calendar_token: CalendarToken,
  activities: Activity[],
  organization_name: string,
): Response {
  const ical_events: ICalEvent[] = activities.map((activity) =>
    convert_activity_to_ical_event(activity, organization_name),
  );
  const feed_name = build_calendar_feed_name(calendar_token, organization_name);
  const config: ICalFeedConfig = {
    feed_name,
    organization_name,
    timezone: CALENDAR_FEED_TIMEZONE,
    reminder_minutes_before: calendar_token.reminder_minutes_before,
  };
  return create_calendar_feed_response(
    generate_ical_feed(ical_events, config),
    feed_name,
  );
}
