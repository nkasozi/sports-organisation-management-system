import { describe, expect, it, vi } from "vitest";

import {
  apply_substitution_to_lineup,
  save_live_game_substitution_lineup,
} from "./liveGameDetailSubstitutionLineup";

const HOME_PLAYERS = [
  { id: "p1", time_on: "present_at_start" },
  { id: "p2", time_on: "didnt_play" },
  { id: "p3", time_on: "present_at_start" },
] as never;

describe("apply_substitution_to_lineup", () => {
  it("marks when the incoming player came on and the outgoing player went off", () => {
    expect(
      apply_substitution_to_lineup(HOME_PLAYERS, {
        player_on_id: "p2",
        player_off_id: "p1",
        minute: "63",
      }),
    ).toEqual([
      { id: "p1", time_on: "present_at_start", time_off: "63" },
      { id: "p2", time_on: "63" },
      { id: "p3", time_on: "present_at_start" },
    ]);
  });

  it("only marks the incoming player when nobody went off", () => {
    expect(
      apply_substitution_to_lineup(HOME_PLAYERS, {
        player_on_id: "p2",
        player_off_id: "",
        minute: "10",
      }),
    ).toEqual([
      { id: "p1", time_on: "present_at_start" },
      { id: "p2", time_on: "10" },
      { id: "p3", time_on: "present_at_start" },
    ]);
  });
});

describe("save_live_game_substitution_lineup", () => {
  it("saves both player changes to the team's lineup in one update", async () => {
    const record_live_player_times = vi
      .fn()
      .mockResolvedValue({ success: true, data: {} });
    const result = await save_live_game_substitution_lineup({
      team_side: "home",
      home_lineup_id: "home-lineup",
      away_lineup_id: "away-lineup",
      home_players: HOME_PLAYERS,
      away_players: [],
      change: { player_on_id: "p2", player_off_id: "p1", minute: "63" },
      fixture_lineup_use_cases: { record_live_player_times } as never,
    });

    expect(record_live_player_times).toHaveBeenCalledTimes(1);
    expect(record_live_player_times).toHaveBeenCalledWith({
      lineup_id: "home-lineup",
      selected_players: expect.arrayContaining([
        { id: "p1", time_on: "present_at_start", time_off: "63" },
        { id: "p2", time_on: "63" },
      ]),
    });
    expect(result.success).toBe(true);
    expect(result.updated_away_players).toEqual([]);
  });

  it("returns a friendly message when the lineup cannot be saved", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await save_live_game_substitution_lineup({
      team_side: "away",
      home_lineup_id: "home-lineup",
      away_lineup_id: "away-lineup",
      home_players: [],
      away_players: HOME_PLAYERS,
      change: { player_on_id: "p2", player_off_id: "p1", minute: "63" },
      fixture_lineup_use_cases: {
        record_live_player_times: vi
          .fn()
          .mockResolvedValue({ success: false, error: "offline" }),
      } as never,
    });

    expect(result.success).toBe(false);
    expect(result.error_message).toBe(
      "The substitution was recorded, but the lineup could not be updated. Please check the lineup.",
    );
    expect(result.updated_away_players[0]).toMatchObject({ time_off: "63" });
  });
});
