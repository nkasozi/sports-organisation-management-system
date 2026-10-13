import { describe, expect, it, vi } from "vitest";

import {
  build_default_period_transition,
  change_game_period,
  end_game_period,
  end_game_session,
  record_game_manage_event,
  start_game_session,
} from "./gameManageActions";

describe("gameManageActions", () => {
  it("delegates start and end session requests to the fixture use cases", async () => {
    const fixture_use_cases = {
      start_fixture: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
      end_fixture: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    };

    await expect(
      start_game_session("fixture-1", fixture_use_cases as never),
    ).resolves.toEqual({
      success: true,
      data: { id: "fixture-1" },
    });
    await expect(
      end_game_session("fixture-1", fixture_use_cases as never),
    ).resolves.toEqual({
      success: true,
      data: { id: "fixture-1" },
    });
  });

  it("records a game event with the quick-event label when no description is provided", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    };

    const record_game_manage_event_result = await record_game_manage_event(
      {
        fixture_id: "fixture-1",
        selected_event_type: { id: "goal", label: "Goal" } as never,
        event_minute: 14,
        selected_team_side: "home",
        event_player_name: "Ada Stone",
        event_description: "",
      },
      fixture_use_cases as never,
    );
    expect(record_game_manage_event_result.success).toBe(true);

    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({
        event_type: "goal",
        minute: 14,
        team_side: "home",
        player_name: "Ada Stone",
        description: "Goal",
      }),
    );
  });

  it("fails fast when the period-start event cannot be recorded", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: false, error: "Event write failed" }),
      update_period: vi.fn(),
    };

    await expect(
      change_game_period({
        fixture: { id: "fixture-1" } as never,
        new_period: "second_half",
        new_period_label: "2nd Half",
        minute: 46,
        fixture_use_cases: fixture_use_cases as never,
      }),
    ).resolves.toEqual({ success: false, error: "Event write failed" });
    expect(fixture_use_cases.update_period).not.toHaveBeenCalled();
  });

  it("ends the current period and returns the completed period label after updating the fixture", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
      update_period: vi.fn().mockResolvedValue({
        success: true,
        data: { id: "fixture-1", current_period: "half_time" },
      }),
    };

    await expect(
      end_game_period({
        fixture: { id: "fixture-1", current_period: "first_half" } as never,
        minute: 45,
        transition: build_default_period_transition({
          id: "fixture-1",
          current_period: "first_half",
        } as never),
        fixture_use_cases: fixture_use_cases as never,
      }),
    ).resolves.toEqual({
      success: true,
      data: {
        fixture: { id: "fixture-1", current_period: "half_time" },
        completed_period_label: "1st Half",
      },
    });
  });
});
