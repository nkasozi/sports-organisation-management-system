import { beforeEach, describe, expect, it, vi } from "vitest";

import { record_live_game_detail_page_event_action } from "./liveGameDetailPagePlayerActions";

const { record_live_game_detail_timed_event_mock } = vi.hoisted(() => ({
  record_live_game_detail_timed_event_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/liveGameDetailActions", () => ({
  record_live_game_detail_timed_event: record_live_game_detail_timed_event_mock,
  update_live_game_player_time_on: vi.fn(),
}));

describe("recording live game events with player ids", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the chosen lineup player ids to the recorded event", async () => {
    record_live_game_detail_timed_event_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });

    const result = await record_live_game_detail_page_event_action({
      away_lineup_id: "away-lineup",
      away_players: [],
      event_description: "",
      event_minute: 30,
      event_player_name: "Ada Stone",
      fixture_id: "fixture-1",
      fixture_lineup_use_cases: {},
      fixture_use_cases: {},
      home_lineup_id: "home-lineup",
      home_players: [],
      is_substitution_event: false,
      secondary_player_name: "Ben Flint",
      secondary_player_id: "home-2",
      selected_event_type: { id: "goal", label: "Goal" },
      selected_player_id: "home-1",
      selected_team_side: "home",
      period_window: { status: "none" },
    } as never);

    expect(result.success).toBe(true);
    expect(record_live_game_detail_timed_event_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_player_id: "home-1",
        secondary_player_id: "home-2",
      }),
    );
  });
});
