import { describe, expect, it } from "vitest";

import {
  type FixtureGenerationConfig,
  generate_round_robin_fixtures,
} from "./FixtureGeneration";

function build_config(
  team_count: number,
  rounds: number,
): FixtureGenerationConfig {
  return {
    organization_id: "org_1",
    competition_id: "comp_1",
    team_ids: Array.from({ length: team_count }, (_, index) => `t${index}`),
    start_date: "2024-01-06",
    match_days_per_week: [6],
    default_time: "15:00",
    venue_rotation: "home_away",
    rounds,
    stage_id_per_round: {},
  } as FixtureGenerationConfig;
}

function count_home_games(
  config: FixtureGenerationConfig,
): Map<string, number> {
  return generate_round_robin_fixtures(config).reduce(
    (counts, fixture) =>
      counts.set(
        fixture.home_team_id,
        (counts.get(fixture.home_team_id) ?? 0) + 1,
      ),
    new Map<string, number>(config.team_ids.map((team_id) => [team_id, 0])),
  );
}

describe("generate_round_robin_fixtures home and away balance", () => {
  it.each([4, 5, 6, 7, 8, 10, 12])(
    "gives every one of %i teams a near-equal number of home games in a single leg",
    (team_count) => {
      const config = build_config(team_count, 1);
      const games_per_team =
        team_count % 2 === 0 ? team_count - 1 : team_count - 1;
      const minimum_home = Math.floor(games_per_team / 2);
      const maximum_home = Math.ceil(games_per_team / 2);
      for (const home_games of count_home_games(config).values()) {
        expect(home_games).toBeGreaterThanOrEqual(minimum_home);
        expect(home_games).toBeLessThanOrEqual(maximum_home);
      }
    },
  );

  it("alternates the fixed team between home and away each round", () => {
    const fixtures = generate_round_robin_fixtures(build_config(6, 1));
    const fixed_team_home_flags = [1, 2, 3, 4, 5].map((round_number) =>
      fixtures.some(
        (fixture) =>
          fixture.round_number === round_number &&
          fixture.home_team_id === "t0",
      ),
    );
    expect(fixed_team_home_flags).toEqual([true, false, true, false, true]);
  });

  it("gives every team exactly as many home as away games over two legs", () => {
    const config = build_config(6, 2);
    for (const home_games of count_home_games(config).values()) {
      expect(home_games).toBe(5);
    }
  });

  it("still pairs every team with every other team exactly once per leg", () => {
    const fixtures = generate_round_robin_fixtures(build_config(8, 1));
    const pair_keys = fixtures.map((fixture) =>
      [fixture.home_team_id, fixture.away_team_id].sort().join("-"),
    );
    expect(new Set(pair_keys).size).toBe(28);
    expect(pair_keys).toHaveLength(28);
  });
});
