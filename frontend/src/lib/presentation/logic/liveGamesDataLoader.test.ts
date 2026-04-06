import { describe, expect, it } from "vitest";
import { ANY_VALUE, type UserScopeProfile } from "$lib/core/interfaces/ports";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import {
  can_user_change_live_games_organization,
  load_live_games_fixture_state,
  load_live_games_organizations,
} from "./liveGamesDataLoader";

function create_profile(
  overrides: Partial<UserScopeProfile> = {},
): UserScopeProfile {
  return {
    user_id: "user_1",
    role: "organisation_admin",
    organization_id: "org_1",
    team_id: "*",
    scopes: {},
    ...overrides,
  } as UserScopeProfile;
}

function create_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    scheduled_date: "2026-04-07",
    scheduled_time: "14:00",
    status: "scheduled",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as Fixture;
}

function create_organization(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: "org_1",
    name: "Uganda Hockey Association",
    sport_id: "sport_1",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as Organization;
}

describe("liveGamesDataLoader", () => {
  it("allows organization switching only for wildcard organization scope", () => {
    expect(
      can_user_change_live_games_organization(
        create_profile({ organization_id: ANY_VALUE }),
      ),
    ).toBe(true);
    expect(can_user_change_live_games_organization(create_profile())).toBe(
      false,
    );
  });

  it("filters organizations to the scoped organization", async () => {
    const organizations = [
      create_organization({ id: "org_1", name: "Org 1" }),
      create_organization({ id: "org_2", name: "Org 2" }),
    ];
    const dependencies = {
      organization_use_cases: {
        list: async () => ({
          success: true,
          data: { items: organizations },
        }),
      },
    };

    const result = await load_live_games_organizations(
      dependencies as never,
      create_profile({ organization_id: "org_2" }),
    );

    expect(result.map((organization) => organization.id)).toEqual(["org_2"]);
  });

  it("loads fixture state and excludes completed fixtures", async () => {
    const fixtures = [
      create_fixture({ id: "fixture_1", status: "scheduled" }),
      create_fixture({ id: "fixture_2", status: "completed" }),
      create_fixture({ id: "fixture_3", status: "cancelled" }),
    ];
    const dependencies = {
      fixture_use_cases: {
        list: async () => ({
          success: true,
          data: { items: fixtures },
        }),
      },
      team_use_cases: {
        get_by_id: async (team_id: string) => ({
          success: true,
          data: { id: team_id, name: `Team ${team_id}` },
        }),
      },
      competition_use_cases: {
        get_by_id: async () => ({
          success: true,
          data: { id: "comp_1", name: "National League", organization_id: "org_1" },
        }),
      },
      organization_use_cases: {
        get_by_id: async () => ({
          success: true,
          data: create_organization(),
        }),
      },
      sport_use_cases: {
        get_by_id: async () => ({
          success: true,
          data: { id: "sport_1", name: "Hockey" },
        }),
      },
    };

    const result = await load_live_games_fixture_state(
      dependencies as never,
      create_profile(),
      "org_1",
    );

    expect(result.fixtures.map((fixture) => fixture.id)).toEqual(["fixture_1"]);
    expect(result.team_names.team_1).toBe("Team team_1");
    expect(result.competition_names.comp_1).toBe("National League");
    expect(result.sport_names.comp_1).toBe("Hockey");
  });
});