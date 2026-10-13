import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

import type { CalendarFeedLookup } from "$convex/lib/calendar_feed_scope";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  CALENDAR_FEED_EVENTS,
  CALENDAR_FEED_RESPONSE_MESSAGES,
} from "./calendarFeedConstants";

export interface CalendarFeedDataSource {
  load_feed(token: string): AsyncResult<CalendarFeedLookup>;
}

const GET_CALENDAR_FEED_QUERY = makeFunctionReference<
  "query",
  { token: string },
  CalendarFeedLookup
>("calendar_feed:get_calendar_feed_by_token");

export function create_convex_calendar_feed_data_source(
  convex_url: string,
): CalendarFeedDataSource {
  return {
    load_feed: async (token) => {
      if (!convex_url) {
        console.error("[Calendar] Convex URL is not configured", {
          event: CALENDAR_FEED_EVENTS.BACKEND_NOT_CONFIGURED,
        });
        return create_failure_result(
          CALENDAR_FEED_RESPONSE_MESSAGES.ACTIVITIES_UNAVAILABLE,
        );
      }
      try {
        const client = new ConvexHttpClient(convex_url);
        return create_success_result(
          await client.query(GET_CALENDAR_FEED_QUERY, { token }),
        );
      } catch (error) {
        console.error("[Calendar] Feed lookup failed", {
          event: CALENDAR_FEED_EVENTS.ACTIVITIES_LOAD_FAILED,
          error: error instanceof Error ? error.message : String(error),
        });
        return create_failure_result(
          CALENDAR_FEED_RESPONSE_MESSAGES.ACTIVITIES_UNAVAILABLE,
        );
      }
    },
  };
}
