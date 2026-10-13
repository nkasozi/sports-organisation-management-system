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
    id: "half_time",
    name: "Half Time",
    duration_minutes: 15,
    is_break: true,
    order: 2,
  },
  {
    id: "second_half",
    name: "Second Half",
    duration_minutes: 45,
    is_break: false,
    order: 3,
  },
];

describe("liveGameDetailPageClockState", () => {
  it("counts down the remaining time of a playing period and offers extra time near its end", () => {
    const clock_state = derive_live_game_detail_clock_state({
      ...create_live_game_detail_page_state(),
      fixture: { current_period: "first_half", status: "in_progress" } as never,
      competition: { rule_overrides: { periods: PERIODS } } as never,
      game_clock_seconds: 44 * 60 + 30,
      extra_time_added_seconds: 0,
    });

    expect(clock_state.is_current_period_playing).toBe(true);
    expect(clock_state.remaining_seconds_in_period).toBe(30);
    expect(clock_state.clock_display).toBe("00:30");
    expect(clock_state.elapsed_minutes).toBe(44);
    expect(clock_state.show_extra_time_button).toBe(true);
  });

  it("reports zero remaining time and a scheduled label before the game starts", () => {
    const clock_state = derive_live_game_detail_clock_state({
      ...create_live_game_detail_page_state(),
      fixture: { status: "scheduled", scheduled_time: "15:00" } as never,
    });

    expect(clock_state.current_period_id).toBeUndefined();
    expect(clock_state.current_period_label).toBe("15:00");
    expect(clock_state.remaining_seconds_in_period).toBe(0);
    expect(clock_state.clock_display).toBe("00:00");
    expect(clock_state.show_extra_time_button).toBe(false);
  });
});
