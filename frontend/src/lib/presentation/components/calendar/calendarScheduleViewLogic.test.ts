import { describe, expect, it } from "vitest";

import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";

import {
  build_calendar_category_signature,
  build_calendar_event_signature,
  convert_iso_to_plain_date,
  convert_iso_to_zoned_datetime,
  convert_to_schedule_x_events,
  format_schedule_clock_time,
} from "./calendarScheduleViewLogic";

function create_event(overrides: Record<string, unknown>): CalendarEvent {
  return {
    id: "event-1",
    title: "Training",
    start: "2024-06-01T09:00:00.000Z",
    end: "2024-06-01T11:00:00.000Z",
    all_day: false,
    category_name: "Practice",
    category_type: "training",
    activity: { description: "Field A" },
    ...overrides,
  } as unknown as CalendarEvent;
}

describe("calendarScheduleViewLogic", () => {
  it("converts ISO strings into zoned date-times at the same instant", () => {
    const zoned = convert_iso_to_zoned_datetime("2024-06-01T09:15:30.000Z");

    expect(zoned.toInstant().toString()).toBe("2024-06-01T09:15:30Z");
    expect(
      convert_iso_to_plain_date("2024-06-01T09:15:30.000Z").toString(),
    ).toBe("2024-06-01");
  });

  it("maps timed and all-day calendar events into schedule-x events", () => {
    const [timed_event, all_day_event] = convert_to_schedule_x_events([
      create_event({}),
      create_event({
        id: "event-2",
        all_day: true,
        start: "2024-06-02T00:00:00.000Z",
        end: "2024-06-03T00:00:00.000Z",
        activity: { description: "" },
      }),
    ]);

    expect(timed_event.id).toBe("event-1");
    expect(timed_event.title).toBe("Training");
    expect(timed_event.description).toBe("Practice - Field A");
    expect(timed_event.calendarId).toBe("training");
    expect(
      (timed_event.start as Temporal.ZonedDateTime).toInstant().toString(),
    ).toBe("2024-06-01T09:00:00Z");
    expect(all_day_event.start.toString()).toBe("2024-06-02");
    expect(all_day_event.end.toString()).toBe("2024-06-03");
    expect(all_day_event.description).toBe("Practice - ");
  });

  it("builds stable signatures for events and categories", () => {
    expect(
      build_calendar_event_signature([
        create_event({}),
        create_event({ id: "event-2" }),
      ]),
    ).toBe(
      "event-1:2024-06-01T09:00:00.000Z:2024-06-01T11:00:00.000Z:training|event-2:2024-06-01T09:00:00.000Z:2024-06-01T11:00:00.000Z:training",
    );
    expect(
      build_calendar_category_signature([
        { id: "c1", color: "#fff", category_type: "training" },
      ] as unknown as ActivityCategory[]),
    ).toBe("c1:#fff:training");
    expect(build_calendar_event_signature([])).toBe("");
  });

  it("formats zoned date-times as two-digit clock times", () => {
    expect(
      format_schedule_clock_time(
        Temporal.ZonedDateTime.from("2024-06-01T07:05:00+00:00[UTC]"),
      ),
    ).toBe("07:05");
  });
});
