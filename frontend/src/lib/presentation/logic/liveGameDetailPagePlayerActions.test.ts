import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  record_live_game_detail_page_event_action,
  update_live_game_detail_player_time_on_action,
} from "./liveGameDetailPagePlayerActions";

const {
  record_live_game_detail_event_mock,
  update_live_game_player_time_on_mock,
} = vi.hoisted(() => ({
  record_live_game_detail_event_mock: vi.fn(),
  update_live_game_player_time_on_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/liveGameDetailActions", () => ({
  record_live_game_detail_event: record_live_game_detail_event_mock,
  update_live_game_player_time_on: update_live_game_player_time_on_mock,
}));

describe("liveGameDetailPagePlayerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the selected away-side lineup while leaving the other team unchanged", async () => {
    update_live_game_player_time_on_mock.mockResolvedValue({
      success: true,
      updated_players: [{ id: "away-1", time_on: "55" }],
    });

    const result = await update_live_game_detail_player_time_on_action({
      away_lineup_id: "away-lineup",
      away_players: [{ id: "away-1", time_on: "present_at_start" }],
      fixture_lineup_use_cases: {},
      home_lineup_id: "home-lineup",
      home_players: [{ id: "home-1", time_on: "present_at_start" }],
      new_time_on: "55",
      player_id: "away-1",
      team_side: "away",
    } as never);

    expect(update_live_game_player_time_on_mock).toHaveBeenCalledWith(
      "away-lineup",
      [{ id: "away-1", time_on: "present_at_start" }],
      "away-1",
      "55",
      {},
    );
    expect(result).toEqual({
      success: true,
      updated_home_players: [{ id: "home-1", time_on: "present_at_start" }],
      updated_away_players: [{ id: "away-1", time_on: "55" }],
      error_message: "",
    });
  });

  it("records non-substitution events without mutating lineup state", async () => {
    record_live_game_detail_event_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });

    const result = await record_live_game_detail_page_event_action({
      away_lineup_id: "away-lineup",
      away_players: [{ id: "away-1" }],
      event_description: "Clean finish",
      event_minute: 32,
      event_player_name: "Ada Stone",
      fixture_id: "fixture-1",
      fixture_lineup_use_cases: {},
      fixture_use_cases: {},
      home_lineup_id: "home-lineup",
      home_players: [{ id: "home-1" }],
      is_substitution_event: false,
      secondary_player_name: "",
      selected_event_type: { id: "goal", label: "Goal" },
      selected_player_id: "",
      selected_team_side: "home",
    } as never);

    expect(update_live_game_player_time_on_mock).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      fixture: { id: "fixture-1" },
      updated_home_players: [{ id: "home-1" }],
      updated_away_players: [{ id: "away-1" }],
      warning_message: "",
      toast_message: "Goal recorded!",
    });
  });

  it("records substitutions and returns any lineup update warning alongside updated players", async () => {
    record_live_game_detail_event_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });
    update_live_game_player_time_on_mock.mockResolvedValue({
      success: false,
      updated_players: [{ id: "home-1", time_on: "67" }],
      error_message: "Lineup sync pending",
    });

    const result = await record_live_game_detail_page_event_action({
      away_lineup_id: "away-lineup",
      away_players: [{ id: "away-1", time_on: "present_at_start" }],
      event_description: "",
      event_minute: 67,
      event_player_name: "Ada Stone",
      fixture_id: "fixture-1",
      fixture_lineup_use_cases: {},
      fixture_use_cases: {},
      home_lineup_id: "home-lineup",
      home_players: [{ id: "home-1", time_on: "present_at_start" }],
      is_substitution_event: true,
      secondary_player_name: "Ben Flint",
      selected_event_type: { id: "substitution", label: "Substitution" },
      selected_player_id: "home-1",
      selected_team_side: "home",
    } as never);

    expect(update_live_game_player_time_on_mock).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      fixture: { id: "fixture-1" },
      updated_home_players: [{ id: "home-1", time_on: "67" }],
      updated_away_players: [{ id: "away-1", time_on: "present_at_start" }],
      warning_message: "Lineup sync pending",
      toast_message: "Substitution recorded!",
    });
  });
});
