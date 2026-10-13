import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";

import { build_fixture_lineup_create_fixture_selection_state } from "./fixtureLineupCreatePageControllerDerivedFixtures";

function create_fixture(
  id: string,
  organization_id: string,
  status: string,
  home_team_id: string,
): Fixture {
  return {
    id,
    organization_id,
    status,
    home_team_id,
    away_team_id: "team-away",
    competition_id: "competition-1",
    scheduled_date: "",
    scheduled_time: "",
  } as unknown as Fixture;
}

const fixtures = [
  create_fixture("fixture-1", "organization-1", "scheduled", "team-1"),
  create_fixture("fixture-2", "organization-1", "completed", "team-2"),
  create_fixture("fixture-3", "organization-2", "scheduled", "team-3"),
  create_fixture("fixture-4", "organization-1", "scheduled", "team-4"),
];

describe("fixtureLineupCreatePageControllerDerivedFixtures", () => {
  it("keeps every fixture when no organization or team restriction applies", () => {
    const state = build_fixture_lineup_create_fixture_selection_state({
      organization_id: "",
      fixtures,
      all_teams: [],
      all_competitions: [],
      fixtures_with_complete_lineups: new Set(["fixture-4"]),
      team_is_restricted: false,
      user_team: { status: "none" },
    });
    expect(state.all_fixtures_for_org).toHaveLength(4);
    expect(state.fixtures_for_user_team).toHaveLength(4);
    expect(state.non_scheduled_fixtures_count).toBe(1);
    expect(
      state.fixtures_for_organization.map((fixture) => fixture.id),
    ).toEqual(["fixture-1", "fixture-3"]);
    expect(state.fixture_select_options[0]).toEqual({
      value: "fixture-1",
      label: "Unknown vs Unknown",
      group: "",
    });
  });

  it("filters by organization and restricted user team", () => {
    const state = build_fixture_lineup_create_fixture_selection_state({
      organization_id: "organization-1",
      fixtures,
      all_teams: [],
      all_competitions: [{ id: "competition-1", name: "League" } as never],
      fixtures_with_complete_lineups: new Set(),
      team_is_restricted: true,
      user_team: { status: "some", value: "team-1" },
    });
    expect(state.all_fixtures_for_org).toHaveLength(3);
    expect(state.fixtures_for_user_team.map((fixture) => fixture.id)).toEqual([
      "fixture-1",
    ]);
    expect(state.fixture_select_options).toEqual([
      {
        value: "fixture-1",
        label: "League - Unknown vs Unknown",
        group: "League",
      },
    ]);
  });
});
