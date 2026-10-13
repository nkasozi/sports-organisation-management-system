import {
  type CalendarFeedLookup,
  CalendarFeedStatus,
} from "$convex/lib/calendar_feed_scope";
import { parse_calendar_token_value } from "$lib/core/types/DomainScalars";

import {
  build_calendar_feed_ics_response,
  create_plain_text_response,
  strip_calendar_token_extension,
} from "./calendarFeedBuilder";
import {
  CALENDAR_FEED_EVENTS,
  CALENDAR_FEED_HTTP_STATUS,
  CALENDAR_FEED_RESPONSE_MESSAGES,
} from "./calendarFeedConstants";
import type { CalendarFeedDataSource } from "./calendarFeedDataSource";

function build_feed_lookup_response(lookup: CalendarFeedLookup): Response {
  switch (lookup.status) {
    case CalendarFeedStatus.NOT_FOUND:
      return create_plain_text_response(
        CALENDAR_FEED_RESPONSE_MESSAGES.NOT_FOUND,
        CALENDAR_FEED_HTTP_STATUS.NOT_FOUND,
      );
    case CalendarFeedStatus.EXPIRED:
      console.log("[Calendar] Expired token access attempt", {
        event: CALENDAR_FEED_EVENTS.TOKEN_EXPIRED,
      });
      return create_plain_text_response(
        CALENDAR_FEED_RESPONSE_MESSAGES.EXPIRED,
        CALENDAR_FEED_HTTP_STATUS.GONE,
      );
    case CalendarFeedStatus.GRANTED:
      return build_calendar_feed_ics_response(lookup.feed);
  }
}

export async function serve_calendar_feed(
  data_source: CalendarFeedDataSource,
  raw_token: string,
): Promise<Response> {
  const token_result = parse_calendar_token_value(
    strip_calendar_token_extension(raw_token),
  );
  if (!token_result.success)
    return create_plain_text_response(
      CALENDAR_FEED_RESPONSE_MESSAGES.INVALID_TOKEN,
      CALENDAR_FEED_HTTP_STATUS.BAD_REQUEST,
    );
  const lookup_result = await data_source.load_feed(token_result.data);
  if (!lookup_result.success)
    return create_plain_text_response(
      lookup_result.error,
      CALENDAR_FEED_HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  return build_feed_lookup_response(lookup_result.data);
}
