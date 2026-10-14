import { describe, expect, it } from "vitest";

import {
  build_player_select_options_for_team,
  build_players_on_field_options,
  get_starters_from_lineup,
  get_substitutes_from_lineup,
  get_time_on_options,
  normalize_lineup_players,
} from "./liveGameDetailLineupState";
import { build_card_severity_rules } from "./liveGamePlayerAvailability";

const FOOTBALL_CARD_RULES = build_card_severity_rules([
  { id: "yellow_card", severity: "warning" },
  { id: "second_yellow", severity: "ejection" },
  { id: "red_card", severity: "ejection" },
]);

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

  it("builds player select options", () => {
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
        [],
        FOOTBALL_CARD_RULES,
      ),
    ).toEqual([{ value: "player-1", label: "#9 Ada Stone" }]);
  });

  it("treats players with omitted time-on values as on-field options", () => {
    expect(
      build_players_on_field_options(
        "home",
        lineup_players,
        [] as never,
        [],
        FOOTBALL_CARD_RULES,
      ),
    ).toEqual([{ value: "player-1", label: "#9 Ada Stone" }]);
  });

  it("offers only players still on the field after substitutions and red cards", () => {
    expect(
      build_players_on_field_options(
        "home",
        lineup_players,
        [] as never,
        [
          {
            event_type: "substitution",
            minute: 50,
            team_side: "home",
            player_name: "Ben Flint",
            secondary_player_name: "Ada Stone",
            recorded_at: "2024-01-01T00:50:00.000Z",
          },
        ] as never,
        FOOTBALL_CARD_RULES,
      ),
    ).toEqual([{ value: "player-2", label: "#14 Ben Flint" }]);
  });
});
