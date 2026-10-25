import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_ACTION_USER_MESSAGE } from "./gameActionMessages";
import { record_live_game_detail_page_event_action } from "./liveGameDetailPagePlayerActions";

const { record_live_game_detail_timed_event_mock } = vi.hoisted(() => ({
  record_live_game_detail_timed_event_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/liveGameDetailActions", () => ({
  record_live_game_detail_timed_event: record_live_game_detail_timed_event_mock,
  update_live_game_player_time_on: vi.fn(),
}));

function record(
  requires_player: boolean,
  selected_player_id: string,
): ReturnType<typeof record_live_game_detail_page_event_action> {
  return record_live_game_detail_page_event_action({
    away_lineup_id: "away-lineup",
    away_players: [],
    event_description: "",
    event_minute: 10,
    event_player_name: "",
    fixture_id: "fixture-1",
    fixture_lineup_use_cases: {},
    fixture_use_cases: {},
    home_lineup_id: "home-lineup",
    home_players: [],
    is_substitution_event: false,
    secondary_player_name: "",
    secondary_player_id: "",
    selected_event_type: { id: "goal", label: "Goal", requires_player },
    selected_player_id,
    selected_team_side: "home",
    event_timing: {
      effective_periods: [],
      current_period_id: { status: "none" },
      elapsed_minutes: 120,
    },
  } as never);
}

describe("events that need a player", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    record_live_game_detail_timed_event_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });
  });

  it("refuses to record a goal before a player is chosen", async () => {
    const result = await record(true, "");
    expect(result).toEqual({
      success: false,
      error_message: GAME_ACTION_USER_MESSAGE.PLAYER_REQUIRED,
    });
    expect(record_live_game_detail_timed_event_mock).not.toHaveBeenCalled();
  });

  it("records events that do not name a player", async () => {
    expect((await record(false, "")).success).toBe(true);
    expect((await record(true, "home-1")).success).toBe(true);
  });
});
