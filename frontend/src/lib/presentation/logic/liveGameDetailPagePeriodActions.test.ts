import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirm_live_game_extra_time_action,
  confirm_live_game_period_action,
} from "./liveGameDetailPagePeriodActions";

const {
  change_game_period_mock,
  end_game_period_mock,
  record_live_game_extra_time_event_mock,
} = vi.hoisted(() => ({
  change_game_period_mock: vi.fn(),
  end_game_period_mock: vi.fn(),
  record_live_game_extra_time_event_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/gameManageActions", () => ({
  change_game_period: change_game_period_mock,
  end_game_period: end_game_period_mock,
}));

vi.mock("$lib/presentation/logic/liveGameDetailActions", () => ({
  record_live_game_extra_time_event: record_live_game_extra_time_event_mock,
}));

describe("liveGameDetailPagePeriodActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const effective_periods = [
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

  it("ends the current period and keeps the clock stopped for break periods", async () => {
    const update_period = vi.fn().mockResolvedValue({ success: true });
    end_game_period_mock.mockResolvedValue({
      success: true,
      data: {
        fixture: { id: "fixture-1", current_period: "half_time" },
        completed_period_label: "First Half",
      },
    });

    const result = await confirm_live_game_period_action({
      effective_periods,
      elapsed_minutes: 45,
      fixture: { id: "fixture-1", current_period: "first_half" },
      fixture_use_cases: { update_period },
      game_clock_seconds: 2700,
      period_button_config: { is_end_action: true, next_period: "half_time" },
      playing_periods: [effective_periods[0], effective_periods[2]],
    } as never);

    expect(end_game_period_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        minute: 45,
        transition: {
          next_period: "half_time",
          completed_period_label: "First Half",
        },
      }),
    );
    expect(update_period).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      fixture: { id: "fixture-1", current_period: "half_time" },
      game_clock_seconds: 2700,
      should_start_clock: true,
      toast_message: "First Half ended",
    });
  });

  it("does not restart the clock after the final playing period ends", async () => {
    end_game_period_mock.mockResolvedValue({
      success: true,
      data: {
        fixture: { id: "fixture-1", current_period: "finished" },
        completed_period_label: "Second Half",
      },
    });

    const result = await confirm_live_game_period_action({
      effective_periods,
      elapsed_minutes: 90,
      fixture: { id: "fixture-1", current_period: "second_half" },
      fixture_use_cases: {},
      game_clock_seconds: 5400,
      period_button_config: { is_end_action: true, next_period: "finished" },
      playing_periods: [effective_periods[0], effective_periods[2]],
    } as never);

    expect(result).toMatchObject({ success: true, should_start_clock: false });
  });

  it("starts the next playing period and advances the game clock to its start", async () => {
    change_game_period_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1", current_period: "second_half" },
    });

    const result = await confirm_live_game_period_action({
      effective_periods,
      elapsed_minutes: 60,
      fixture: { id: "fixture-1", current_period: "half_time" },
      fixture_use_cases: {},
      game_clock_seconds: 0,
      period_button_config: {
        is_end_action: false,
        next_period: "second_half",
      },
      playing_periods: [effective_periods[0], effective_periods[2]],
    } as never);

    expect(change_game_period_mock).toHaveBeenCalledWith({
      fixture: { id: "fixture-1", current_period: "half_time" },
      new_period: "second_half",
      new_period_label: "Second Half",
      minute: 45,
      period_sequence: ["first_half", "half_time", "second_half"],
      fixture_use_cases: {},
    });
    expect(result).toEqual({
      success: true,
      fixture: { id: "fixture-1", current_period: "second_half" },
      game_clock_seconds: 2700,
      should_start_clock: true,
      toast_message: "Second Half started!",
    });
  });

  it("records added time and returns the number of seconds added to the clock", async () => {
    record_live_game_extra_time_event_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1", current_period: "first_half" },
    });

    const result = await confirm_live_game_extra_time_action({
      effective_periods,
      elapsed_minutes: 44,
      extra_minutes_to_add: 3,
      fixture: { id: "fixture-1", current_period: "first_half" },
      fixture_use_cases: {},
    } as never);

    expect(record_live_game_extra_time_event_mock).toHaveBeenCalledWith(
      "fixture-1",
      44,
      3,
      "First Half",
      {},
    );
    expect(result).toEqual({
      success: true,
      fixture: { id: "fixture-1", current_period: "first_half" },
      seconds_added: 180,
      toast_message: "3 min added time - First Half",
    });
  });
});
