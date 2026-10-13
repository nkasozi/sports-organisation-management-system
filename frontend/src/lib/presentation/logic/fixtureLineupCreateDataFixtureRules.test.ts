import { describe, expect, it } from "vitest";

import type { Team } from "$lib/core/entities/Team";
import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  apply_competition_player_limit_overrides,
  build_sport_player_limits,
  build_teams_with_existing_lineups,
  collect_fixture_teams,
  DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS,
  resolve_auto_selected_team_id,
} from "./fixtureLineupCreateDataFixtureRules";

function create_team(id: string, name: string): Team {
  return { id, name } as unknown as Team;
}

describe("fixtureLineupCreateDataFixtureRules", () => {
  it("falls back to default sport limits for zero values", () => {
    expect(
      build_sport_player_limits({
        min_players_per_fixture: 0,
        max_players_per_fixture: 0,
        max_players_on_field: 0,
      } as never),
    ).toEqual(DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS);
  });

  it("uses the sport limits when present", () => {
    expect(
      build_sport_player_limits({
        min_players_per_fixture: 5,
        max_players_per_fixture: 12,
        max_players_on_field: 5,
      } as never),
    ).toEqual({ min_players: 5, max_players: 12, starters_count: 5 });
  });

  it("returns the limits unchanged when no overrides exist", () => {
    expect(
      apply_competition_player_limit_overrides(
        DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS,
        {},
      ),
    ).toEqual(DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS);
  });

  it("applies only the overrides that are explicitly present", () => {
    expect(
      apply_competition_player_limit_overrides(
        DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS,
        { max_squad_size: 22, max_players_on_field: 7 },
      ),
    ).toEqual({ min_players: 2, max_players: 22, starters_count: 7 });
  });

  it("collects only successfully loaded teams", () => {
    const home_team = create_team("team-1", "Home");
    expect(
      collect_fixture_teams([
        { success: true, data: home_team },
        { success: false },
        { success: true },
      ]),
    ).toEqual([home_team]);
  });

  it("labels existing lineups by fixture label, team name, or raw id", () => {
    const teams = [
      create_team("team-1", "Home"),
      create_team("team-2", "Away"),
    ];
    const labels = new Map([["team-1", "Home Label"]]);
    const result = build_teams_with_existing_lineups(
      [{ team_id: "team-1" }, { team_id: "team-2" }, { team_id: "team-9" }],
      teams,
      labels,
    );
    expect([...result.entries()]).toEqual([
      ["team-1", "Home Label"],
      ["team-2", "Away"],
      ["team-9", "team-9"],
    ]);
  });

  it("auto-selects the preselected team only when it is available", () => {
    const available = [create_team("team-1", "Home")];
    expect(
      resolve_auto_selected_team_id(create_some_option("team-1"), available),
    ).toBe("team-1");
    expect(
      resolve_auto_selected_team_id(create_some_option("team-2"), available),
    ).toBe("");
    expect(resolve_auto_selected_team_id(create_none_option(), available)).toBe(
      "",
    );
  });
});
