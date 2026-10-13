import { describe, expect, it, vi } from "vitest";

import { NO_SCORE_AWARD } from "$lib/core/entities/SportEventCatalog";

import { confirm_live_game_period_action } from "./liveGameDetailPagePeriodActions";
import { build_period_button_config } from "./liveGameDetailPeriodState";

const HOCKEY_PERIODS = [
  {
    id: "first_quarter",
    name: "1st Quarter",
    duration_minutes: 15,
    is_break: false,
  },
  { id: "break_1", name: "Break 1", duration_minutes: 2, is_break: true },
  {
    id: "second_quarter",
    name: "2nd Quarter",
    duration_minutes: 15,
    is_break: false,
  },
  { id: "half_time", name: "Half Time", duration_minutes: 10, is_break: true },
  {
    id: "third_quarter",
    name: "3rd Quarter",
    duration_minutes: 15,
    is_break: false,
  },
  { id: "break_2", name: "Break 2", duration_minutes: 2, is_break: true },
  {
    id: "fourth_quarter",
    name: "4th Quarter",
    duration_minutes: 15,
    is_break: false,
  },
] as never;

function create_fixture_use_cases(): {
  record_game_event: ReturnType<typeof vi.fn>;
  update_period: ReturnType<typeof vi.fn>;
} {
  return {
    record_game_event: vi.fn().mockResolvedValue({ success: true, data: {} }),
    update_period: vi.fn(async (fixture_id: string, period: string) => ({
      success: true,
      data: { id: fixture_id, current_period: period },
    })),
  };
}

describe("ending a period follows the sport's own period sequence", () => {
  it("moves from the 1st quarter to the first break, not to full time", async () => {
    const fixture = {
      id: "fixture-1",
      current_period: "first_quarter",
    } as never;
    const fixture_use_cases = create_fixture_use_cases();
    const period_button_config = build_period_button_config(
      "first_quarter" as never,
      true,
      HOCKEY_PERIODS,
    );

    const result = await confirm_live_game_period_action({
      effective_periods: HOCKEY_PERIODS,
      elapsed_minutes: 15,
      fixture,
      fixture_use_cases: fixture_use_cases as never,
      game_clock_seconds: 900,
      period_button_config: period_button_config as never,
      playing_periods: HOCKEY_PERIODS,
    });

    expect(result.success).toBe(true);
    expect(fixture_use_cases.update_period).toHaveBeenCalledWith(
      "fixture-1",
      "break_1",
      15,
    );
    expect(fixture_use_cases.update_period).toHaveBeenCalledTimes(1);
  });

  it("labels the period-end event with the sport's period name", async () => {
    const fixture = {
      id: "fixture-1",
      current_period: "first_quarter",
    } as never;
    const fixture_use_cases = create_fixture_use_cases();

    await confirm_live_game_period_action({
      effective_periods: HOCKEY_PERIODS,
      elapsed_minutes: 15,
      fixture,
      fixture_use_cases: fixture_use_cases as never,
      game_clock_seconds: 900,
      period_button_config: build_period_button_config(
        "first_quarter" as never,
        true,
        HOCKEY_PERIODS,
      ) as never,
      playing_periods: HOCKEY_PERIODS,
    });

    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({ description: "1st Quarter ended" }),
      NO_SCORE_AWARD,
    );
  });

  it("labels the period-start event with the sport's period name", async () => {
    const fixture = { id: "fixture-1", current_period: "break_1" } as never;
    const fixture_use_cases = create_fixture_use_cases();

    await confirm_live_game_period_action({
      effective_periods: HOCKEY_PERIODS,
      elapsed_minutes: 15,
      fixture,
      fixture_use_cases: fixture_use_cases as never,
      game_clock_seconds: 900,
      period_button_config: build_period_button_config(
        "break_1" as never,
        true,
        HOCKEY_PERIODS,
      ) as never,
      playing_periods: HOCKEY_PERIODS,
    });

    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({ description: "2nd Quarter started" }),
      NO_SCORE_AWARD,
    );
  });
});
