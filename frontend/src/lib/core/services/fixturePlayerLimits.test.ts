import { describe, expect, it } from "vitest";

import {
  apply_competition_fixture_player_limit_overrides,
  build_sport_fixture_player_limits,
  DEFAULT_FIXTURE_PLAYER_LIMITS,
  has_complete_player_limit_overrides,
} from "./fixturePlayerLimits";

describe("fixture player limits", () => {
  it("uses the sport's squad size and players on field", () => {
    expect(
      build_sport_fixture_player_limits({
        min_players_per_fixture: 5,
        max_players_per_fixture: 12,
        max_players_on_field: 5,
      }),
    ).toEqual({ min_players: 5, max_players: 12, starters_count: 5 });
  });

  it("falls back to defaults for missing sport values", () => {
    expect(
      build_sport_fixture_player_limits({
        min_players_per_fixture: 0,
        max_players_per_fixture: 0,
        max_players_on_field: 0,
      }),
    ).toEqual(DEFAULT_FIXTURE_PLAYER_LIMITS);
  });

  it("maps squad size and on-field overrides to the right limits", () => {
    expect(
      apply_competition_fixture_player_limit_overrides(
        { min_players: 2, max_players: 18, starters_count: 11 },
        {
          max_squad_size: 22,
          max_players_on_field: 15,
          min_players_on_field: 10,
        },
      ),
    ).toEqual({ min_players: 10, max_players: 22, starters_count: 15 });
  });

  it("does not cap starters at eleven for sports with larger teams", () => {
    expect(
      apply_competition_fixture_player_limit_overrides(
        { min_players: 15, max_players: 23, starters_count: 15 },
        {},
      ).starters_count,
    ).toBe(15);
  });

  it("never allows more starters than the squad can hold", () => {
    expect(
      apply_competition_fixture_player_limit_overrides(
        { min_players: 2, max_players: 18, starters_count: 11 },
        { max_squad_size: 9 },
      ),
    ).toEqual({ min_players: 2, max_players: 9, starters_count: 9 });
  });

  it("ignores non-numeric overrides", () => {
    expect(
      apply_competition_fixture_player_limit_overrides(
        DEFAULT_FIXTURE_PLAYER_LIMITS,
        { max_squad_size: "20" as never },
      ),
    ).toEqual(DEFAULT_FIXTURE_PLAYER_LIMITS);
  });

  it("knows when overrides fully define the limits", () => {
    expect(
      has_complete_player_limit_overrides({
        min_players_on_field: 4,
        max_squad_size: 10,
        max_players_on_field: 6,
      }),
    ).toBe(true);
    expect(
      has_complete_player_limit_overrides({
        min_players_on_field: 4,
        max_players_on_field: 6,
      }),
    ).toBe(false);
  });
});
