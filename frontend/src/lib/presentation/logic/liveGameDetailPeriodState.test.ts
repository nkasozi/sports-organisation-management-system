import { describe, expect, it } from "vitest";

import {
  build_period_button_config,
  check_is_playing_period,
  get_current_period_duration_seconds,
  get_effective_periods_for,
  get_period_start_seconds,
  get_playing_periods,
  get_sport_period_display_name,
} from "./liveGameDetailPeriodState";

describe("liveGameDetailPeriodState", () => {
  const all_periods = [
    {
      id: "first_half",
      name: "First Half",
      duration_minutes: 45,
      is_break: false,
    },
    {
      id: "half_time",
      name: "Half Time",
      duration_minutes: 15,
      is_break: true,
    },
    {
      id: "second_half",
      name: "Second Half",
      duration_minutes: 45,
      is_break: false,
    },
  ] as never;

  it("derives effective periods, playing periods, and period timing from sport or competition rules", () => {
    expect(
      get_effective_periods_for(
        { periods: [{ id: "sport_period" }] } as never,
        {
          rule_overrides: { periods: [{ id: "competition_period" }] },
        } as never,
      ),
    ).toEqual([{ id: "competition_period" }]);
    expect(get_playing_periods(all_periods).map((period) => period.id)).toEqual(
      ["first_half", "second_half"],
    );
    expect(
      get_period_start_seconds("second_half", get_playing_periods(all_periods)),
    ).toBe(2700);
    expect(
      get_current_period_duration_seconds(
        "unknown_period" as never,
        get_playing_periods(all_periods),
      ),
    ).toBe(2700);
    expect(
      get_sport_period_display_name("half_time" as never, all_periods),
    ).toBe("Half Time");
  });

  it("builds end and start button configs around breaks and checks playing-period state", () => {
    expect(build_period_button_config("first_half", true, all_periods)).toEqual(
      {
        label: "End First Half",
        icon: "⏹️",
        is_end_action: true,
        next_period: "half_time",
        message: "Are you sure you want to end First Half?",
        confirm_text: "End First Half",
      },
    );
    expect(build_period_button_config("half_time", true, all_periods)).toEqual({
      label: "Start Second Half",
      icon: "▶️",
      is_end_action: false,
      next_period: "second_half",
      message:
        "Are you sure you want to start Second Half? The clock will resume.",
      confirm_text: "Start Second Half",
    });
    expect(check_is_playing_period("penalty_shootout", [] as never)).toBe(true);
    expect(check_is_playing_period("half_time" as never, all_periods)).toBe(
      false,
    );
  });
});
