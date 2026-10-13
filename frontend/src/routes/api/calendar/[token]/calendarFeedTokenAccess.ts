import {
  type CalendarToken,
  is_calendar_token_expired,
} from "$lib/core/entities/CalendarToken";
import type { CalendarTokenValue } from "$lib/core/types/DomainScalars";
import type { get_use_cases_container } from "$lib/infrastructure/container";

import { create_plain_text_response } from "./calendarFeedBuilder";
import {
  CALENDAR_FEED_ACCESS_STATUS,
  CALENDAR_FEED_EVENTS,
  CALENDAR_FEED_HTTP_STATUS,
  CALENDAR_FEED_RESPONSE_MESSAGES,
} from "./calendarFeedConstants";

type CalendarFeedUseCases = ReturnType<typeof get_use_cases_container>;

type CalendarFeedTokenAccess =
  | {
      status: typeof CALENDAR_FEED_ACCESS_STATUS.GRANTED;
      calendar_token: CalendarToken;
    }
  | {
      status: typeof CALENDAR_FEED_ACCESS_STATUS.REJECTED;
      response: Response;
    };

export async function resolve_calendar_feed_token_access(
  use_cases: CalendarFeedUseCases,
  token: CalendarTokenValue,
): Promise<CalendarFeedTokenAccess> {
  const calendar_token_result =
    await use_cases.calendar_token_use_cases.get_feed_by_token(token);
  if (!calendar_token_result.success || !calendar_token_result.data) {
    return {
      status: CALENDAR_FEED_ACCESS_STATUS.REJECTED,
      response: create_plain_text_response(
        CALENDAR_FEED_RESPONSE_MESSAGES.NOT_FOUND,
        CALENDAR_FEED_HTTP_STATUS.NOT_FOUND,
      ),
    };
  }
  const calendar_token = calendar_token_result.data;
  if (is_calendar_token_expired(calendar_token.expires_at)) {
    console.log("[Calendar] Expired token access attempt", {
      event: CALENDAR_FEED_EVENTS.TOKEN_EXPIRED,
      token_id: calendar_token.id,
    });
    return {
      status: CALENDAR_FEED_ACCESS_STATUS.REJECTED,
      response: create_plain_text_response(
        CALENDAR_FEED_RESPONSE_MESSAGES.EXPIRED,
        CALENDAR_FEED_HTTP_STATUS.GONE,
      ),
    };
  }
  return { status: CALENDAR_FEED_ACCESS_STATUS.GRANTED, calendar_token };
}
