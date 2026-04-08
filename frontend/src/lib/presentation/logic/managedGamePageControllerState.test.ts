import { describe, expect, it } from "vitest";

import {
  apply_managed_game_bundle,
  build_managed_game_page_title,
  close_managed_game_event_modal,
  create_managed_game_page_state,
  derive_managed_game_view_state,
  managed_game_primary_events,
  managed_game_secondary_events,
  open_managed_game_event_modal,
  set_managed_game_loading_error,
  set_managed_game_toast,
} from "./managedGamePageControllerState";

describe("managedGamePageControllerState", () => {
  it("creates the default managed-game state and exposes quick-event groupings", () => {
    expect(create_managed_game_page_state()).toEqual({
      fixture: null,
      home_team: null,
      away_team: null,
      home_players: [],
      away_players: [],
      is_loading: true,
      error_message: "",
      is_updating: false,
      game_clock_seconds: 0,
      is_clock_running: false,
      show_start_modal: false,
      show_end_modal: false,
      show_event_modal: false,
      selected_event_type: null,
      selected_team_side: "home",
      event_player_name: "",
      event_description: "",
      event_minute: 0,
      toast_visible: false,
      toast_message: "",
      toast_type: "info",
    });
    expect(
      managed_game_primary_events.length + managed_game_secondary_events.length,
    ).toBeGreaterThan(0);
  });

  it("applies bundle data and derives view-state display values", () => {
    const state = apply_managed_game_bundle(create_managed_game_page_state(), {
      fixture: {
        current_period: "first_half",
        home_team_score: 1,
        away_team_score: 2,
        status: "in_progress",
        game_events: [
          { minute: 10, recorded_at: "2024-01-01T10:00:00.000Z" },
          { minute: 20, recorded_at: "2024-01-01T10:05:00.000Z" },
        ],
      },
      home_team: { name: "Lions" },
      away_team: { name: "Tigers" },
      home_players: [{ id: "home-player" }],
      away_players: [{ id: "away-player" }],
      game_clock_seconds: 75,
    } as never);

    expect(
      derive_managed_game_view_state({
        ...state,
        selected_team_side: "away",
      }),
    ).toEqual(
      expect.objectContaining({
        available_players: [{ id: "away-player" }],
        away_score: 2,
        away_team_name: "Tigers",
        home_score: 1,
        home_team_name: "Lions",
        current_period_label: "1st Half",
        is_game_active: true,
        sorted_events: [
          { minute: 20, recorded_at: "2024-01-01T10:05:00.000Z" },
          { minute: 10, recorded_at: "2024-01-01T10:00:00.000Z" },
        ],
      }),
    );
    expect(build_managed_game_page_title(state)).toBe("Lions vs Tigers");
  });

  it("opens and closes the event modal while surfacing loading and toast feedback", () => {
    const with_error = set_managed_game_loading_error(
      create_managed_game_page_state(),
      "Failed to load game",
    );
    const with_toast = set_managed_game_toast(with_error, "Saved", "success");
    const modal_open = open_managed_game_event_modal(
      with_toast,
      managed_game_primary_events[0],
      "away",
      67,
    );

    expect(modal_open).toEqual(
      expect.objectContaining({
        error_message: "Failed to load game",
        is_loading: false,
        toast_visible: true,
        toast_message: "Saved",
        toast_type: "success",
        show_event_modal: true,
        selected_team_side: "away",
        event_minute: 67,
      }),
    );
    expect(close_managed_game_event_modal(modal_open)).toEqual(
      expect.objectContaining({
        show_event_modal: false,
        selected_event_type: null,
        event_player_name: "",
        event_description: "",
        event_minute: 0,
      }),
    );
  });
});
