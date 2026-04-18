import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { CreateFixtureInput, Fixture } from "../../core/entities/Fixture";
import { InBrowserFixtureRepository } from "./InBrowserFixtureRepository";

class TestFixtureRepository extends InBrowserFixtureRepository {
  expose_create_entity_from_input(
    input: CreateFixtureInput,
    id: Fixture["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Fixture {
    return this.create_entity_from_input(input, id, timestamps);
  }
}

function create_fixture_input(
  overrides: Partial<CreateFixtureInput> = {},
): CreateFixtureInput {
  return {
    organization_id: "organization_1",
    competition_id: "competition_1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id: "team_home",
    away_team_id: "team_away",
    venue: "Main Stadium",
    scheduled_date: "2026-04-10",
    scheduled_time: "15:00",
    assigned_officials: [],
    match_day: 1,
    notes: "",
    stage_id: "stage_1",
    status: "scheduled",
    ...overrides,
  };
}

describe("InBrowserFixtureRepository", () => {
  it("creates fixtures with explicit zero scores", () => {
    const repository = new TestFixtureRepository();

    const fixture = repository.expose_create_entity_from_input(
      create_fixture_input(),
      "fixture_1" as Fixture["id"],
      {
        created_at: "2026-04-10T00:00:00.000Z",
        updated_at: "2026-04-10T00:00:00.000Z",
      } as Pick<BaseEntity, "created_at" | "updated_at">,
    );

    expect(fixture.home_team_score).toBe(0);
    expect(fixture.away_team_score).toBe(0);
  });
});
