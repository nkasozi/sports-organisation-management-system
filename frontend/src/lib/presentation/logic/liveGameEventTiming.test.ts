import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  build_playing_period_window,
  normalize_event_time_for_period,
} from "./liveGameEventTiming";

const FIRST_HALF = create_some_option({ start_minute: 0, end_minute: 45 });
const SECOND_HALF = create_some_option({ start_minute: 45, end_minute: 90 });

describe("normalize_event_time_for_period", () => {
  it("keeps minutes inside the period unchanged", () => {
    expect(normalize_event_time_for_period(30, FIRST_HALF)).toEqual({
      minute: 30,
      stoppage_time_minute: 0,
    });
  });

  it("records first-half stoppage time as 45+n", () => {
    expect(normalize_event_time_for_period(47, FIRST_HALF)).toEqual({
      minute: 45,
      stoppage_time_minute: 2,
    });
  });

  it("never places a second-half event inside the first half", () => {
    expect(normalize_event_time_for_period(45, SECOND_HALF)).toEqual({
      minute: 46,
      stoppage_time_minute: 0,
    });
  });

  it("leaves the time alone outside a playing period", () => {
    expect(normalize_event_time_for_period(47, create_none_option())).toEqual({
      minute: 47,
      stoppage_time_minute: 0,
    });
  });
});

describe("build_playing_period_window", () => {
  const periods = [
    { id: "first_half", duration_minutes: 45, is_break: false },
    { id: "second_half", duration_minutes: 45, is_break: false },
  ] as never;

  it("builds the minute window of the current playing period", () => {
    expect(build_playing_period_window("second_half", periods)).toEqual(
      SECOND_HALF,
    );
  });

  it("has no window for breaks or unknown periods", () => {
    expect(build_playing_period_window("half_time", periods)).toEqual(
      create_none_option(),
    );
  });
});
