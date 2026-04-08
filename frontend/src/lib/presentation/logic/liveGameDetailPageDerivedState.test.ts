import { describe, expect, it } from "vitest";

import {
  derive_live_game_detail_view_state,
  get_live_game_page_title,
} from "./liveGameDetailPageDerivedState";
import {
  create_live_game_detail_event_state,
  create_live_game_detail_page_state,
} from "./liveGameDetailPageStateFactories";

describe("liveGameDetailPageDerivedState", () => {
  it("derives break-period timing, sorting, and display metadata for an active fixture", () => {
    const derived_state = derive_live_game_detail_view_state({
      event_state: {
        ...create_live_game_detail_event_state(),
        selected_team_side: "home",
        selected_event_type: { id: "goal" } as never,
      },
      page_state: {
        ...create_live_game_detail_page_state(),
        fixture: {
          home_team_id: "team-home",
          away_team_id: "team-away",
          current_period: "half_time",
          status: "in_progress",
          scheduled_time: "19:30",
          home_team_score: 1,
          away_team_score: 0,
          venue: "Fallback Venue",
          game_events: [
            { minute: 5, recorded_at: "2024-01-01T10:05:00.000Z" },
            { minute: 5, recorded_at: "2024-01-01T10:00:00.000Z" },
            { minute: 3, recorded_at: "2024-01-01T09:59:00.000Z" },
          ],
        } as never,
        competition: {
          rule_overrides: {
            periods: [
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
            ],
          },
        } as never,
        home_team: { name: "Lions" } as never,
        away_team: { name: "Tigers" } as never,
        venue: {
          name: "National Stadium",
          city: "Nairobi",
          country: "Kenya",
        } as never,
        break_elapsed_seconds: 120,
        extra_time_added_seconds: 30,
        home_players: [
          {
            id: "home-1",
            first_name: "Ada",
            last_name: "Stone",
            jersey_number: 9,
            is_substitute: false,
            time_on: "present_at_start",
          },
        ] as never,
        away_players: [
          {
            id: "away-1",
            first_name: "Bo",
            last_name: "Reed",
            jersey_number: 4,
            is_substitute: true,
            time_on: "didnt_play",
          },
        ] as never,
      },
    });

    expect(derived_state).toEqual(
      expect.objectContaining({
        current_period_label: "Half Time",
        is_current_period_playing: false,
        remaining_seconds_in_period: 810,
        clock_display: "13:30",
        home_score: 1,
        away_score: 0,
        show_extra_time_button: false,
        player_select_options: [{ value: "home-1", label: "#9 Ada Stone" }],
        players_on_field_options: [{ value: "home-1", label: "#9 Ada Stone" }],
        venue_name: "National Stadium",
        venue_location: "Nairobi, Kenya",
        home_team_color: "#3b82f6",
        away_team_color: "#ef4444",
        officials_color: "",
      }),
    );
    expect(derived_state.period_button_config).toEqual({
      label: "Start Second Half",
      icon: "▶️",
      is_end_action: false,
      next_period: "second_half",
      message:
        "Are you sure you want to start Second Half? The clock will resume.",
      confirm_text: "Start Second Half",
    });
    expect(derived_state.sorted_events).toEqual([
      { minute: 3, recorded_at: "2024-01-01T09:59:00.000Z" },
      { minute: 5, recorded_at: "2024-01-01T10:00:00.000Z" },
      { minute: 5, recorded_at: "2024-01-01T10:05:00.000Z" },
    ]);
    expect(derived_state.team_names).toEqual({
      "team-home": "Lions",
      "team-away": "Tigers",
    });
    expect(derived_state.all_event_buttons.length).toBeGreaterThan(0);
  });

  it("uses fallback labels and page titles when fixture data is absent or completed", () => {
    expect(get_live_game_page_title(create_live_game_detail_page_state())).toBe(
      "Live Game Management",
    );
    expect(
      derive_live_game_detail_view_state({
        event_state: create_live_game_detail_event_state(),
        page_state: {
          ...create_live_game_detail_page_state(),
          fixture: {
            status: "completed",
            scheduled_time: "21:00",
            current_period: null,
            game_events: [],
          } as never,
        },
      }).current_period_label,
    ).toBe("Full Time");
  });
});
