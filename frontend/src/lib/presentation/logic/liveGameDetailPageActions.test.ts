import { describe, expect, it, vi } from "vitest";

import {
  confirm_live_game_period_action,
  record_live_game_detail_page_event_action,
  update_live_game_detail_player_time_on_action,
} from "./liveGameDetailPageActions";

describe("liveGameDetailPageActions", () => {
  it("updates the selected player time-on status through the shell export", async () => {
    await expect(
      update_live_game_detail_player_time_on_action({
        away_lineup_id: "away-lineup",
        away_players: [{ id: "away-1", time_on: "present_at_start" }] as never,
        fixture_lineup_use_cases: {
          update: vi.fn().mockResolvedValue({ success: true }),
        } as never,
        home_lineup_id: "home-lineup",
        home_players: [{ id: "home-1", time_on: "present_at_start" }] as never,
        new_time_on: "55",
        player_id: "home-1",
        team_side: "home",
      }),
    ).resolves.toEqual({
      success: true,
      updated_home_players: [{ id: "home-1", time_on: "55" }],
      updated_away_players: [{ id: "away-1", time_on: "present_at_start" }],
      error_message: "",
    });
  });

  it("records a regular goal event through the shell export without mutating lineups", async () => {
    await expect(
      record_live_game_detail_page_event_action({
        away_lineup_id: "away-lineup",
        away_players: [{ id: "away-1" }] as never,
        event_description: "Clean finish",
        event_minute: 32,
        event_player_name: "Ada Stone",
        fixture_id: "fixture-1",
        fixture_lineup_use_cases: {} as never,
        fixture_use_cases: {
          record_game_event: vi
            .fn()
            .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
        } as never,
        home_lineup_id: "home-lineup",
        home_players: [{ id: "home-1" }] as never,
        is_substitution_event: false,
        secondary_player_name: "",
        selected_event_type: { id: "goal", label: "Goal" } as never,
        selected_player_id: "",
        selected_team_side: "home",
      }),
    ).resolves.toEqual({
      success: true,
      fixture: { id: "fixture-1" },
      updated_home_players: [{ id: "home-1" }],
      updated_away_players: [{ id: "away-1" }],
      warning_message: "",
      toast_message: "Goal recorded!",
    });
  });

  it("starts the next playing period through the shell export and advances the clock", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
      update_period: vi.fn().mockResolvedValue({
        success: true,
        data: { id: "fixture-1", current_period: "second_half" },
      }),
    } as never;

    await expect(
      confirm_live_game_period_action({
        effective_periods: [
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
        ] as never,
        elapsed_minutes: 60,
        fixture: { id: "fixture-1", current_period: "half_time" } as never,
        fixture_use_cases,
        game_clock_seconds: 0,
        period_button_config: {
          is_end_action: false,
          next_period: "second_half",
        } as never,
        playing_periods: [
          { id: "first_half", duration_minutes: 45 },
          { id: "second_half", duration_minutes: 45 },
        ] as never,
      }),
    ).resolves.toEqual({
      success: true,
      fixture: { id: "fixture-1", current_period: "second_half" },
      game_clock_seconds: 2700,
      should_start_clock: true,
      toast_message: "Second Half started!",
    });
  });
});
