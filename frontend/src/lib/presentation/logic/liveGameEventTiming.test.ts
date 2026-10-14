import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  attribute_event_time,
  EVENT_TIMING_MESSAGE,
} from "./liveGameEventTiming";

const FOOTBALL_PERIODS: Parameters<
  typeof attribute_event_time
>[1]["effective_periods"] = [
  {
    id: "first_half",
    name: "1st Half",
    duration_minutes: 45,
    is_break: false,
    order: 1,
  },
  {
    id: "half_time",
    name: "Half Time",
    duration_minutes: 15,
    is_break: true,
    order: 2,
  },
  {
    id: "second_half",
    name: "2nd Half",
    duration_minutes: 45,
    is_break: false,
    order: 3,
  },
] as never;

function context_in(
  current_period: string,
  elapsed_minutes: number,
): Parameters<typeof attribute_event_time>[1] {
  return {
    effective_periods: FOOTBALL_PERIODS,
    current_period_id: create_some_option(current_period),
    elapsed_minutes,
  };
}

function expect_time(
  minute: number,
  context: Parameters<typeof attribute_event_time>[1],
): ReturnType<typeof expect<unknown>> {
  const result = attribute_event_time(minute, context);
  return expect(result.success ? result.data : result.error);
}

describe("attribute_event_time", () => {
  it("keeps a minute inside the current period unchanged", () => {
    expect_time(30, context_in("first_half", 31)).toEqual({
      minute: 30,
      stoppage_time_minute: 0,
      period: create_some_option("first_half"),
    });
  });

  it("records first-half stoppage time as 45+n in the current period", () => {
    expect_time(47, context_in("first_half", 47)).toEqual({
      minute: 45,
      stoppage_time_minute: 2,
      period: create_some_option("first_half"),
    });
  });

  it("attributes an earlier minute entered in the second half to the first half", () => {
    expect_time(20, context_in("second_half", 60)).toEqual({
      minute: 20,
      stoppage_time_minute: 0,
      period: create_some_option("first_half"),
    });
  });

  it("does not turn an earlier-period minute into stoppage time", () => {
    expect_time(44, context_in("second_half", 80)).toEqual({
      minute: 44,
      stoppage_time_minute: 0,
      period: create_some_option("first_half"),
    });
  });

  it("attributes events during a break to the period that just ended", () => {
    expect_time(46, context_in("half_time", 46)).toEqual({
      minute: 45,
      stoppage_time_minute: 1,
      period: create_some_option("first_half"),
    });
  });

  it("rejects a minute that has not been played yet", () => {
    expect_time(70, context_in("second_half", 60)).toBe(
      EVENT_TIMING_MESSAGE.MINUTE_NOT_PLAYED,
    );
  });

  it("allows the minute that is currently being played", () => {
    expect(
      attribute_event_time(61, context_in("second_half", 60)).success,
    ).toBe(true);
  });

  it("rejects negative minutes", () => {
    expect_time(-1, context_in("first_half", 10)).toBe(
      EVENT_TIMING_MESSAGE.NEGATIVE_MINUTE,
    );
  });

  it("leaves the time alone when the sport defines no periods", () => {
    expect_time(12, {
      effective_periods: [],
      current_period_id: create_some_option("match"),
      elapsed_minutes: 12,
    }).toEqual({
      minute: 12,
      stoppage_time_minute: 0,
      period: create_none_option(),
    });
  });
});
