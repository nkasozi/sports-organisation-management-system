import { describe, expect, it, vi } from "vitest";

import {
  confirm_live_game_extra_time_action,
  end_live_game_detail_action,
  start_live_game_detail_action,
} from "./liveGameDetailPageGameActions";

describe("liveGameDetailPageGameActions", () => {
  type StartCommand = Parameters<typeof start_live_game_detail_action>[0];
  type EndCommand = Parameters<typeof end_live_game_detail_action>[0];
  type ExtraTimeCommand = Parameters<
    typeof confirm_live_game_extra_time_action
  >[0];

  function create_lineup_player(
    id: string,
  ): StartCommand["home_players"][number] {
    return {
      id,
      first_name: "Ada",
      last_name: "Stone",
      jersey_number: 0,
      position: "",
      is_captain: false,
      is_substitute: false,
    } as StartCommand["home_players"][number];
  }

  it("starts a fixture session through the shell export when lineups are already present", async () => {
    const command = {
      allow_auto_submission: false,
      away_players: [create_lineup_player("away-1")],
      away_team: { name: "Tigers" } as StartCommand["away_team"],
      competition_use_cases: {} as StartCommand["competition_use_cases"],
      fixture: { id: "fixture-1" } as StartCommand["fixture"],
      fixture_lineup_use_cases: {} as StartCommand["fixture_lineup_use_cases"],
      fixture_use_cases: {
        start_fixture: vi
          .fn()
          .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
        update_period: vi.fn(),
      } as unknown as StartCommand["fixture_use_cases"],
      home_players: [create_lineup_player("home-1")],
      home_team: { name: "Lions" } as StartCommand["home_team"],
      official_use_cases: {} as StartCommand["official_use_cases"],
      organization_use_cases: {} as StartCommand["organization_use_cases"],
      player_membership_use_cases:
        {} as StartCommand["player_membership_use_cases"],
      player_use_cases: {} as StartCommand["player_use_cases"],
      playing_periods: [
        { id: "first_half" },
      ] as StartCommand["playing_periods"],
      reload_fixture: vi.fn(),
      sport_use_cases: {} as StartCommand["sport_use_cases"],
      team_use_cases: {} as StartCommand["team_use_cases"],
      venue_use_cases: {} as StartCommand["venue_use_cases"],
    } as StartCommand;

    await expect(start_live_game_detail_action(command)).resolves.toEqual({
      success: true,
      fixture: { id: "fixture-1" },
      toast_message: "Game started! Clock is running.",
    });
  });

  it("records the final whistle and ends the game through the shell export", async () => {
    const fixture_use_cases = {
      end_fixture: vi.fn().mockResolvedValue({
        success: true,
        data: { id: "fixture-1", status: "completed" },
      }),
      record_game_event: vi.fn().mockResolvedValue({ success: true }),
    } as Pick<
      EndCommand["fixture_use_cases"],
      "end_fixture" | "record_game_event"
    >;

    await expect(
      end_live_game_detail_action({
        away_score: 1,
        elapsed_minutes: 95,
        fixture: {
          id: "fixture-1",
          current_period: "second_half",
        } as EndCommand["fixture"],
        fixture_use_cases: fixture_use_cases as EndCommand["fixture_use_cases"],
        home_score: 2,
      }),
    ).resolves.toEqual({
      success: true,
      fixture: { id: "fixture-1", status: "completed" },
    });
    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({ description: "Match ended. Final score: 2-1" }),
    );
  });

  it("records extra time and returns the added seconds through the shell export", async () => {
    await expect(
      confirm_live_game_extra_time_action({
        effective_periods: [
          { id: "first_half", name: "First Half" },
        ] as ExtraTimeCommand["effective_periods"],
        elapsed_minutes: 44,
        extra_minutes_to_add: 3,
        fixture: {
          id: "fixture-1",
          current_period: "first_half",
        } as ExtraTimeCommand["fixture"],
        fixture_use_cases: {
          record_game_event: vi.fn().mockResolvedValue({
            success: true,
            data: { id: "fixture-1", current_period: "first_half" },
          }),
        } as unknown as ExtraTimeCommand["fixture_use_cases"],
      }),
    ).resolves.toEqual({
      success: true,
      fixture: { id: "fixture-1", current_period: "first_half" },
      seconds_added: 180,
      toast_message: "3 min added time - First Half",
    });
  });
});
