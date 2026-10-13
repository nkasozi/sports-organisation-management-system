import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_ACTION_USER_MESSAGE } from "./gameActionMessages";
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

describe("liveGameDetailPageSessionActions failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns a friendly message when the game session fails to start", async () => {
    ensure_live_game_lineups_before_start_mock.mockResolvedValue({
      success: true,
      reloaded_required: false,
    });
    start_game_session_mock.mockResolvedValue({
      success: false,
      error: "Dexie write failed",
    });

    const result = await start_live_game_detail_action({
      fixture: { id: "fixture-1" },
      playing_periods: [],
    } as never);

    expect(result).toEqual({
      success: false,
      error_message: GAME_ACTION_USER_MESSAGE.START_GAME_FAILED,
    });
    expect(console.error).toHaveBeenCalledWith(
      "[GameAction] Game action failed",
      expect.objectContaining({
        event: "game_start_failed",
        fixture_id: "fixture-1",
        error: "Dexie write failed",
      }),
    );
  });

  it("does not end the session when the final whistle event cannot be saved", async () => {
    const record_game_event = vi
      .fn()
      .mockResolvedValue({ success: false, error: "write failed" });

    const result = await end_live_game_detail_action({
      away_score: 0,
      elapsed_minutes: 90,
      fixture: { id: "fixture-1" },
      fixture_use_cases: { record_game_event },
      home_score: 1,
    } as never);

    expect(end_game_session_mock).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error_message: GAME_ACTION_USER_MESSAGE.END_GAME_FAILED,
    });
  });

  it("keeps the started fixture and logs when the first period update fails", async () => {
    ensure_live_game_lineups_before_start_mock.mockResolvedValue({
      success: true,
      reloaded_required: false,
    });
    start_game_session_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1", status: "in_progress" },
    });
    const update_period = vi
      .fn()
      .mockResolvedValue({ success: false, error: "update failed" });

    const result = await start_live_game_detail_action({
      fixture: { id: "fixture-1" },
      fixture_use_cases: { update_period },
      playing_periods: [{ id: "first_quarter" }],
    } as never);

    expect(result).toMatchObject({
      success: true,
      fixture: { id: "fixture-1", status: "in_progress" },
    });
    expect(console.error).toHaveBeenCalledWith(
      "[LiveGameDetail] First period update failed",
      expect.objectContaining({ event: "game_first_period_update_failed" }),
    );
  });
});
