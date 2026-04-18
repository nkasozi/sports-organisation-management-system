import { describe, expect, it } from "vitest";

import {
  build_missing_lineups_error_message,
  build_player_select_options_for_team,
  build_players_on_field_options,
  get_event_bg_class,
  get_starters_from_lineup,
  get_substitutes_from_lineup,
  get_time_on_options,
  normalize_lineup_players,
} from "./liveGameDetailLineupState";

describe("liveGameDetailLineupState", () => {
  const lineup_players = [
    {
      id: "player-1",
      first_name: "Ada",
      last_name: "Stone",
      jersey_number: 9,
      is_substitute: false,
    },
    {
      id: "player-2",
      first_name: "Ben",
      last_name: "Flint",
      jersey_number: 14,
      is_substitute: true,
      time_on: "didnt_play",
    },
  ] as never;

  it("normalizes lineup players and splits starters from substitutes", () => {
    const normalized_players = normalize_lineup_players(lineup_players);

    expect(normalized_players[0].time_on).toBe("present_at_start");
    expect(
      get_starters_from_lineup(normalized_players).map((player) => player.id),
    ).toEqual(["player-1"]);
    expect(
      get_substitutes_from_lineup(normalized_players).map(
        (player) => player.id,
      ),
    ).toEqual(["player-2"]);
    expect(get_time_on_options(2).slice(0, 4)).toEqual([
      { value: "present_at_start", label: "Present at Start" },
      { value: "didnt_play", label: "Didn't Play" },
      { value: "1", label: "1'" },
      { value: "2", label: "2'" },
    ]);
  });

  it("builds lineup error messages, event colors, and player select options", () => {
    expect(
      build_missing_lineups_error_message(true, false, "Lions", "Tigers"),
    ).toBe("Lions has not submitted their squad for this fixture.");
    expect(get_event_bg_class({ event_type: "red_card" } as never)).toBe(
      "border-l-red-500 bg-red-50 dark:bg-red-900/20",
    );
    expect(
      build_player_select_options_for_team("home", lineup_players, [] as never),
    ).toEqual([
      { value: "player-1", label: "#9 Ada Stone" },
      { value: "player-2", label: "#14 Ben Flint" },
    ]);
    expect(
      build_players_on_field_options(
        "home",
        normalize_lineup_players(lineup_players),
        [] as never,
      ),
    ).toEqual([{ value: "player-1", label: "#9 Ada Stone" }]);
  });

  it("treats players with omitted time-on values as on-field options", () => {
    expect(
      build_players_on_field_options("home", lineup_players, [] as never),
    ).toEqual([{ value: "player-1", label: "#9 Ada Stone" }]);
  });
});
