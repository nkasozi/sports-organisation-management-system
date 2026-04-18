import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  end_live_game_detail_action,
  start_live_game_detail_action,
} from "./liveGameDetailPageSessionActions";

const {
  end_game_session_mock,
  ensure_live_game_lineups_before_start_mock,
  start_game_session_mock,
} = vi.hoisted(() => ({
  end_game_session_mock: vi.fn(),
  ensure_live_game_lineups_before_start_mock: vi.fn(),
  start_game_session_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/gameManageActions", () => ({
  end_game_session: end_game_session_mock,
  start_game_session: start_game_session_mock,
}));

vi.mock("$lib/presentation/logic/liveGameDetailActions", () => ({
  ensure_live_game_lineups_before_start:
    ensure_live_game_lineups_before_start_mock,
}));

describe("liveGameDetailPageSessionActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a failure result when lineup validation fails before the game starts", async () => {
    ensure_live_game_lineups_before_start_mock.mockResolvedValue({
      success: false,
      error_message: "Home squad missing",
    });

    const result = await start_live_game_detail_action({
      allow_auto_submission: false,
      away_players: [],
      away_team: { name: "Tigers" },
      fixture: { id: "fixture-1" },
      fixture_lineup_use_cases: {},
      fixture_use_cases: { update_period: vi.fn() },
      home_players: [],
      home_team: { name: "Lions" },
      player_membership_use_cases: {},
      player_use_cases: {},
      playing_periods: [{ id: "first_half" }],
      reload_fixture: vi.fn(),
    } as never);

    expect(result).toEqual({
      success: false,
      error_message: "Home squad missing",
    });
    expect(start_game_session_mock).not.toHaveBeenCalled();
  });

  it("reloads the fixture, starts the session, and advances to the first configured period", async () => {
    const reload_fixture = vi.fn().mockResolvedValue({ id: "fixture-2" });
    const update_period = vi.fn().mockResolvedValue({ success: true });
    ensure_live_game_lineups_before_start_mock.mockResolvedValue({
      success: true,
      reloaded_required: true,
    });
    start_game_session_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-2", status: "in_progress" },
    });

    const result = await start_live_game_detail_action({
      allow_auto_submission: true,
      away_players: [],
      away_team: { name: "Tigers" },
      fixture: { id: "fixture-1" },
      fixture_lineup_use_cases: {},
      fixture_use_cases: { update_period },
      home_players: [],
      home_team: { name: "Lions" },
      player_membership_use_cases: {},
      player_use_cases: {},
      playing_periods: [{ id: "second_half" }],
      reload_fixture,
    } as never);

    expect(reload_fixture).toHaveBeenCalled();
    expect(update_period).toHaveBeenCalledWith("fixture-2", "second_half", 0);
    expect(result).toEqual({
      success: true,
      fixture: {
        id: "fixture-2",
        status: "in_progress",
        current_period: "second_half",
      },
      toast_message: "Game started! Clock is running.",
    });
  });

  it("records a final whistle event and ends the game session", async () => {
    const record_game_event = vi.fn().mockResolvedValue({ success: true });
    end_game_session_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1", status: "completed" },
    });

    const result = await end_live_game_detail_action({
      away_score: 1,
      elapsed_minutes: 95,
      fixture: { id: "fixture-1", current_period: "second_half" },
      fixture_use_cases: { end_fixture: vi.fn(), record_game_event },
      home_score: 2,
    } as never);

    expect(record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({
        event_type: "period_end",
        minute: 95,
        description: "Match ended. Final score: 2-1",
      }),
    );
    expect(result).toEqual({
      success: true,
      fixture: { id: "fixture-1", status: "completed" },
    });
  });
});
