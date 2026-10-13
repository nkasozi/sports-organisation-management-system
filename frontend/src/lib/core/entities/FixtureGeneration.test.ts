import { describe, expect, it } from "vitest";

import {
  type FixtureGenerationConfig,
  generate_round_robin_fixtures,
} from "./FixtureGeneration";

function build_config(
  team_ids: string[],
  overrides: Partial<FixtureGenerationConfig> = {},
): FixtureGenerationConfig {
  return {
    organization_id: "org_1",
    competition_id: "comp_1",
    team_ids,
    start_date: "2024-01-06",
    match_days_per_week: [6],
    default_time: "15:00",
    venue_rotation: "home_away",
    rounds: 1,
    stage_id_per_round: { 1: "stage_1" },
    ...overrides,
  } as FixtureGenerationConfig;
}

function pairings(config: FixtureGenerationConfig): string[] {
  return generate_round_robin_fixtures(config).map(
    (fixture) =>
      `${fixture.round_number}:${fixture.home_team_id}-${fixture.away_team_id}`,
  );
}

describe("generate_round_robin_fixtures", () => {
  it("pairs four teams over three rounds using the circle method", () => {
    expect(pairings(build_config(["a", "b", "c", "d"]))).toEqual([
      "1:a-d",
      "1:b-c",
      "2:a-c",
      "2:d-b",
      "3:a-b",
      "3:c-d",
    ]);
  });

  it("skips bye pairings for an odd number of teams", () => {
    expect(pairings(build_config(["a", "b", "c"]))).toEqual([
      "1:b-c",
      "2:a-c",
      "3:a-b",
    ]);
  });

  it("reverses home and away in the return leg", () => {
    expect(pairings(build_config(["a", "b"], { rounds: 2 }))).toEqual([
      "1:a-b",
      "2:b-a",
    ]);
  });

  it("fills round metadata, weekly dates and stage mapping", () => {
    const fixtures = generate_round_robin_fixtures(
      build_config(["a", "b"], { rounds: 2 }),
    );
    expect(fixtures[0]).toMatchObject({
      round_name: "Round 1",
      scheduled_date: "2024-01-06",
      match_day: 1,
      stage_id: "stage_1",
      venue: "",
      status: "scheduled",
      assigned_officials: [],
    });
    expect(fixtures[1]).toMatchObject({
      scheduled_date: "2024-01-13",
      match_day: 2,
      stage_id: "",
    });
  });

  it("uses the single venue when that rotation is chosen", () => {
    const fixtures = generate_round_robin_fixtures(
      build_config(["a", "b"], {
        venue_rotation: "single_venue",
        single_venue: "Main Stadium",
      } as Partial<FixtureGenerationConfig>),
    );
    expect(fixtures[0].venue).toBe("Main Stadium");
  });
});
