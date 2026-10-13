import { describe, expect, it, vi } from "vitest";

import type { CalendarFeedLookup } from "$convex/lib/calendar_feed_scope";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import type { CalendarFeedDataSource } from "./calendarFeedDataSource";
import { serve_calendar_feed } from "./calendarFeedResponder";

const VALID_TOKEN = "a".repeat(64);

function data_source_returning(
  lookup: CalendarFeedLookup,
): CalendarFeedDataSource & { load_feed: ReturnType<typeof vi.fn> } {
  return { load_feed: vi.fn(async () => create_success_result(lookup)) };
}

function granted_feed(
  overrides: Partial<
    Extract<CalendarFeedLookup, { status: "granted" }>["feed"]
  >,
): CalendarFeedLookup {
  return {
    status: "granted",
    feed: {
      organization_id: "org-1",
      organization_name: "Org One",
      feed_type: "team",
      entity_id: "team-1",
      entity_name: "Lions",
      reminder_minutes_before: 30,
      events: [
        {
          local_id: "a1",
          title: "Training",
          description: "Bring boots",
          location: "Pitch 1",
          start_datetime: "2030-06-01T10:00:00.000Z",
          end_datetime: "2030-06-01T12:00:00.000Z",
          is_all_day: false,
          reminder_minutes_before: 0,
        },
      ],
      ...overrides,
    },
  };
}

describe("serve_calendar_feed", () => {
  it("rejects malformed tokens without querying the backend", async () => {
    const data_source = data_source_returning({ status: "not_found" });
    const response = await serve_calendar_feed(data_source, "bad token!.ics");
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid token format");
    expect(data_source.load_feed).not.toHaveBeenCalled();
  });

  it("maps unknown and expired feeds to 404 and 410", async () => {
    const missing = await serve_calendar_feed(
      data_source_returning({ status: "not_found" }),
      `${VALID_TOKEN}.ics`,
    );
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe("Calendar feed not found or inactive");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const expired = await serve_calendar_feed(
      data_source_returning({ status: "expired" }),
      VALID_TOKEN,
    );
    expect(expired.status).toBe(410);
  });

  it("returns 503 when the backend lookup fails", async () => {
    const response = await serve_calendar_feed(
      { load_feed: async () => create_failure_result("unavailable") },
      VALID_TOKEN,
    );
    expect(response.status).toBe(503);
  });

  it("serves the scoped events returned by the backend as an ICS feed", async () => {
    const data_source = data_source_returning(granted_feed({}));
    const response = await serve_calendar_feed(
      data_source,
      `${VALID_TOKEN}.ics`,
    );
    const body = await response.text();
    expect(data_source.load_feed).toHaveBeenCalledWith(VALID_TOKEN);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="Lions___Team_Schedule.ics"',
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate",
    );
    expect(body).toContain("UID:activity-a1@org-one");
    expect(body).toContain("SUMMARY:Training");
  });

  it("names all-event feeds after the organization", async () => {
    const response = await serve_calendar_feed(
      data_source_returning(granted_feed({ feed_type: "all", entity_id: "" })),
      VALID_TOKEN,
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="Org_One_Calendar.ics"',
    );
  });
});
