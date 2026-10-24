import { describe, expect, it } from "vitest";

import { derive_live_game_detail_clock_state } from "./liveGameDetailPageClockState";
import { create_live_game_detail_page_state } from "./liveGameDetailPageStateFactories";

const PERIODS = [
  {
    id: "first_half",
    name: "First Half",
    duration_minutes: 45,
    is_break: false,
    order: 1,
  },
  {
    id: "second_half",
    name: "Second Half",
    duration_minutes: 45,
    is_break: false,
    order: 2,
  },
];

describe("clock at full time", () => {
  it("shows 00:00 once the regular periods are over instead of an overtime length", () => {
    const clock_state = derive_live_game_detail_clock_state({
      ...create_live_game_detail_page_state(),
      fixture: { current_period: "finished", status: "in_progress" } as never,
      competition: { rule_overrides: { periods: PERIODS } } as never,
      game_clock_seconds: 90 * 60,
      extra_time_added_seconds: 0,
    });

    expect(clock_state.clock_display).toBe("00:00");
    expect(clock_state.remaining_seconds_in_period).toBe(0);
  });
});
