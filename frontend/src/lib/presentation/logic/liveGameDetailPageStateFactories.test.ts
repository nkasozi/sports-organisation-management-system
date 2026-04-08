import { describe, expect, it } from "vitest";

import {
  apply_live_game_detail_bundle,
  create_live_game_detail_event_state,
  create_live_game_detail_modal_state,
  create_live_game_detail_page_state,
  create_live_game_detail_toast_state,
  get_live_game_detail_event_player,
  open_live_game_detail_event_state,
} from "./liveGameDetailPageStateFactories";

describe("liveGameDetailPageStateFactories", () => {
  it("creates default state objects for the page, modal, event, and toast", () => {
    expect(create_live_game_detail_page_state().is_loading).toBe(true);
    expect(create_live_game_detail_modal_state()).toEqual({
      show_start_modal: false,
      show_end_modal: false,
      show_period_modal: false,
      show_extra_time_modal: false,
    });
    expect(create_live_game_detail_event_state().selected_team_side).toBe(
      "home",
    );
    expect(create_live_game_detail_toast_state()).toEqual({
      is_visible: false,
      message: "",
      type: "info",
    });
  });

  it("applies bundle data while preserving unrelated page flags", () => {
    const result = apply_live_game_detail_bundle(
      {
        ...create_live_game_detail_page_state(),
        is_loading: false,
        can_modify_game: true,
      },
      {
        fixture: { id: "fixture-1" },
        home_team: { name: "Lions" },
        away_team: { name: "Tigers" },
        competition: { id: "competition-1" },
        sport: { id: "sport-1" },
        venue: { name: "National Stadium" },
        organization_name: "Premier League",
        assigned_officials_data: [
          {
            official: { first_name: "Sam", last_name: "Hill" },
            role_name: "Referee",
          },
        ],
        home_players: [{ id: "home-1" }],
        away_players: [{ id: "away-1" }],
        home_lineup_id: "home-lineup",
        away_lineup_id: "away-lineup",
        game_clock_seconds: 125,
      } as never,
    );

    expect(result).toEqual(
      expect.objectContaining({
        fixture: { id: "fixture-1" },
        organization_name: "Premier League",
        home_lineup_id: "home-lineup",
        away_lineup_id: "away-lineup",
        game_clock_seconds: 125,
        is_loading: false,
        can_modify_game: true,
      }),
    );
  });

  it("opens an event state and resolves player names from lineup selections", () => {
    expect(
      open_live_game_detail_event_state({
        elapsed_minutes: 67,
        event_button: { id: "goal", label: "Goal" },
        team_side: "away",
      } as never),
    ).toEqual(
      expect.objectContaining({
        show_event_modal: true,
        selected_team_side: "away",
        event_minute: 67,
      }),
    );
    expect(
      get_live_game_detail_event_player({
        player_id: "player-1",
        players: [
          { id: "player-1", first_name: "Ada", last_name: "Stone" },
        ] as never,
      }),
    ).toEqual({ player_id: "player-1", player_name: "Ada Stone" });
    expect(
      get_live_game_detail_event_player({
        player_id: "missing-player",
        players: [] as never,
      }),
    ).toEqual({ player_id: "missing-player", player_name: "" });
  });
});
