import { describe, expect, it } from "vitest";

import type { Fixture } from "../../core/entities/Fixture";
import {
  apply_fixture_entity_filter,
  sort_fixtures_by_schedule,
} from "./InBrowserFixtureRepositoryHelpers";

function create_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "competition_1",
    stage_id: "stage_1",
    home_team_id: "team_a",
    away_team_id: "team_b",
    round_number: 1,
    match_day: 1,
    status: "scheduled",
    scheduled_date: "2026-04-10",
    scheduled_time: "10:00",
    ...overrides,
  } as Fixture;
}

describe("InBrowserFixtureRepositoryHelpers", () => {
  it("filters fixtures across team, stage, status, and date boundaries", () => {
    const matching_fixture = create_fixture();
    const other_fixture = create_fixture({
      id: "fixture_2",
      away_team_id: "team_c",
      scheduled_date: "2026-04-12",
      status: "completed",
    });

    expect(
      apply_fixture_entity_filter([matching_fixture, other_fixture], {
        stage_id: "stage_1",
        status: "scheduled",
        team_id: "team_b",
        scheduled_date_from: "2026-04-01",
        scheduled_date_to: "2026-04-10",
      }),
    ).toEqual([matching_fixture]);
  });

  it("sorts fixtures by date and then time without mutating the source array", () => {
    const fixtures = [
      create_fixture({
        id: "fixture_1",
        scheduled_date: "2026-04-12",
        scheduled_time: "12:00",
      }),
      create_fixture({
        id: "fixture_2",
        scheduled_date: "2026-04-10",
        scheduled_time: "15:00",
      }),
      create_fixture({
        id: "fixture_3",
        scheduled_date: "2026-04-10",
        scheduled_time: "09:00",
      }),
    ];

    expect(
      sort_fixtures_by_schedule(fixtures).map((fixture: Fixture) => fixture.id),
    ).toEqual(["fixture_3", "fixture_2", "fixture_1"]);
    expect(fixtures.map((fixture: Fixture) => fixture.id)).toEqual([
      "fixture_1",
      "fixture_2",
      "fixture_3",
    ]);
  });
});
