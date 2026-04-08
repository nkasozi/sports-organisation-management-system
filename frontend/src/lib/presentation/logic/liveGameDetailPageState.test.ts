import { describe, expect, it } from "vitest";

import {
  apply_live_game_detail_bundle,
  create_live_game_detail_event_state,
  create_live_game_detail_modal_state,
  create_live_game_detail_page_state,
  create_live_game_detail_toast_state,
  derive_live_game_detail_view_state,
  get_live_game_detail_event_player,
  get_live_game_page_title,
  open_live_game_detail_event_state,
} from "./liveGameDetailPageState";

describe("liveGameDetailPageState", () => {
  const competition_periods = [
    {
      id: "first_half",
      name: "First Half",
      duration_minutes: 40,
      is_break: false,
    },
    {
      id: "half_time",
      name: "Half Time",
      duration_minutes: 10,
      is_break: true,
    },
    {
      id: "second_half",
      name: "Second Half",
      duration_minutes: 40,
      is_break: false,
    },
  ] as never;

  it("creates default page, modal, event, and toast state", () => {
    expect(create_live_game_detail_page_state()).toEqual({
      fixture: null,
      home_team: null,
      away_team: null,
      competition: null,
      sport: null,
      venue: null,
      organization_name: "",
      assigned_officials_data: [],
      home_players: [],
      away_players: [],
      home_lineup_id: "",
      away_lineup_id: "",
      is_loading: true,
      error_message: "",
      is_updating: false,
      game_clock_seconds: 0,
      is_clock_running: false,
      extra_time_added_seconds: 0,
      extra_minutes_to_add: 5,
      break_elapsed_seconds: 0,
      downloading_report: false,
      can_modify_game: false,
      permission_info_message: "",
      home_lineup_expanded: false,
      away_lineup_expanded: false,
    });
    expect(create_live_game_detail_modal_state()).toEqual({
      show_start_modal: false,
      show_end_modal: false,
      show_period_modal: false,
      show_extra_time_modal: false,
    });
    expect(create_live_game_detail_event_state()).toEqual({
      show_event_modal: false,
      selected_event_type: null,
      selected_team_side: "home",
      selected_player_id: "",
      secondary_player_id: "",
      event_player_name: "",
      secondary_player_name: "",
      event_description: "",
      event_minute: 0,
    });
    expect(create_live_game_detail_toast_state()).toEqual({
      is_visible: false,
      message: "",
      type: "info",
    });
  });

  it("applies bundle data and re-exported helpers derive view state and player details", () => {
    const page_state = apply_live_game_detail_bundle(
      create_live_game_detail_page_state(),
      {
        fixture: {
          home_team_id: "team-home",
          away_team_id: "team-away",
          current_period: "first_half",
          status: "in_progress",
          scheduled_time: "18:00",
          home_team_score: 2,
          away_team_score: 1,
          venue: "Fallback Venue",
          home_team_jersey: { main_color: "#111111" },
          away_team_jersey: { main_color: "#222222" },
          officials_jersey: { main_color: "#333333" },
          game_events: [
            { minute: 12, recorded_at: "2024-01-01T12:00:00.000Z" },
          ],
        },
        home_team: { name: "Lions" },
        away_team: { name: "Tigers" },
        competition: { rule_overrides: { periods: competition_periods } },
        sport: { periods: [{ id: "sport_period" }] },
        venue: { name: "Central Park", city: "Kampala", country: "Uganda" },
        organization_name: "Premier League",
        assigned_officials_data: [
          {
            official: { first_name: "Sam", last_name: "Hill" },
            role_name: "Referee",
          },
        ],
        home_players: [
          {
            id: "home-1",
            first_name: "Ada",
            last_name: "Stone",
            jersey_number: 9,
            is_substitute: false,
            time_on: "present_at_start",
          },
        ],
        away_players: [
          {
            id: "away-1",
            first_name: "Bo",
            last_name: "Reed",
            jersey_number: 4,
            is_substitute: false,
            time_on: "present_at_start",
          },
        ],
        home_lineup_id: "home-lineup",
        away_lineup_id: "away-lineup",
        game_clock_seconds: 2280,
      } as never,
    );
    const event_state = open_live_game_detail_event_state({
      elapsed_minutes: 38,
      event_button: { id: "substitution" },
      team_side: "away",
    } as never);

    expect(
      get_live_game_detail_event_player({
        player_id: "away-1",
        players: page_state.away_players,
      }),
    ).toEqual({ player_id: "away-1", player_name: "Bo Reed" });
    expect(event_state).toEqual(
      expect.objectContaining({
        show_event_modal: true,
        selected_team_side: "away",
        event_minute: 38,
      }),
    );
    expect(
      derive_live_game_detail_view_state({
        event_state,
        page_state,
      }),
    ).toEqual(
      expect.objectContaining({
        current_period_label: "First Half",
        clock_display: "02:00",
        home_score: 2,
        away_score: 1,
        is_substitution_event: true,
        show_extra_time_button: true,
        player_select_options: [{ value: "away-1", label: "#4 Bo Reed" }],
        players_on_field_options: [{ value: "away-1", label: "#4 Bo Reed" }],
        assigned_officials: [{ name: "Sam Hill", role_name: "Referee" }],
        venue_location: "Kampala, Uganda",
        home_team_short_name: "LIO",
        away_team_short_name: "TIG",
      }),
    );
    expect(get_live_game_page_title(page_state)).toBe("Lions vs Tigers");
  });
});
