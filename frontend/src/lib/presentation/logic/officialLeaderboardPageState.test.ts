import { describe, expect, it } from "vitest";

import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type { Organization } from "$lib/core/entities/Organization";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import { ANY_VALUE, type UserScopeProfile } from "$lib/core/interfaces/ports";

import { load_official_leaderboard_page_state } from "./officialLeaderboardPageLoad";
import {
  can_user_change_official_leaderboard_organizations,
  rebuild_official_leaderboard_view,
  resolve_official_leaderboard_organizations,
} from "./officialLeaderboardPageState";

function create_profile(
  overrides: Partial<ScalarInput<UserScopeProfile>> = {},
): UserScopeProfile {
  return {
    user_id: "user_1",
    role: "officials_manager",
    organization_id: "org_1",
    team_id: "*",
    scopes: {},
    ...overrides,
  } as unknown as UserScopeProfile;
}

function create_organization(
  overrides: Partial<ScalarInput<Organization>> = {},
): Organization {
  return {
    id: "org_1",
    name: "Org 1",
    sport_id: "sport_1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Organization;
}

function create_official(
  overrides: Partial<ScalarInput<Official>> = {},
): Official {
  return {
    id: "official_1",
    organization_id: "org_1",
    first_name: "Jamie",
    last_name: "Ref",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Official;
}

function create_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    stage_id: "stage_1",
    home_team_id: "team_a",
    away_team_id: "team_b",
    home_team_name: "Alpha",
    away_team_name: "Beta",
    scheduled_date: "2026-01-01",
    scheduled_time: "15:00",
    status: "completed",
    match_day: 1,
    manual_importance_override: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

function create_stage(
  overrides: Partial<ScalarInput<CompetitionStage>> = {},
): CompetitionStage {
  return {
    id: "stage_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    stage_name: "League",
    stage_type: "league_stage",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as CompetitionStage;
}

function create_rating(
  overrides: Partial<ScalarInput<OfficialPerformanceRating>> = {},
): OfficialPerformanceRating {
  return {
    id: "rating_1",
    organization_id: "org_1",
    official_id: "official_1",
    fixture_id: "fixture_1",
    rater_user_id: "user_1",
    rater_role: "officials_manager",
    overall: 8,
    decision_accuracy: 8,
    game_control: 8,
    communication: 8,
    fitness: 8,
    notes: "Strong control",
    submitted_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as OfficialPerformanceRating;
}

describe("officialLeaderboardPageState", () => {
  it("allows organization switching only for wildcard or empty organization scope", () => {
    expect(
      can_user_change_official_leaderboard_organizations(
        create_profile({ organization_id: ANY_VALUE }),
      ),
    ).toBe(true);
    expect(
      can_user_change_official_leaderboard_organizations(
        create_profile({ organization_id: "" }),
      ),
    ).toBe(true);
    expect(
      can_user_change_official_leaderboard_organizations(create_profile()),
    ).toBe(false);
  });

  it("filters organizations to the scoped organization", () => {
    const result = resolve_official_leaderboard_organizations(
      [
        create_organization(),
        create_organization({ id: "org_2", name: "Org 2" }),
      ],
      create_profile({ organization_id: "org_2" }),
    );

    expect(result.map((organization) => organization.id)).toEqual(["org_2"]);
  });

  it("rebuilds entries and preselects the scoped official", () => {
    const result = rebuild_official_leaderboard_view({
      all_ratings: [create_rating()],
      all_officials: [create_official()],
      all_fixtures: [create_fixture()],
      all_stages: [create_stage()],
      selected_organization_id: "org_1",
      user_official_id: "official_1",
    });

    expect(result.leaderboard_entries).toHaveLength(1);
    expect(result.selected_entry?.official_id).toBe("official_1");
    expect(result.selected_breakdown).toHaveLength(1);
  });

  it("returns a failure result when leaderboard data loading fails", async () => {
    const result = await load_official_leaderboard_page_state({
      profile: create_profile(),
      dependencies: {
        organization_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_organization()] },
          }),
        },
        official_performance_rating_use_cases: {
          list: async () => ({ success: false }),
        },
        official_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_official()] },
          }),
        },
        fixture_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_fixture()] },
          }),
        },
        competition_stage_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_stage()] },
          }),
        },
      } as never,
    });

    expect(result.success).toBe(false);
  });

  it("loads leaderboard page state with resolved organizations and entries", async () => {
    const result = await load_official_leaderboard_page_state({
      profile: create_profile({ official_id: "official_1" }),
      dependencies: {
        organization_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_organization()] },
          }),
        },
        official_performance_rating_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_rating()] },
          }),
        },
        official_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_official()] },
          }),
        },
        fixture_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_fixture()] },
          }),
        },
        competition_stage_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_stage()] },
          }),
        },
      } as never,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.selected_organization_id).toBe("org_1");
    expect(result.data.leaderboard_entries).toHaveLength(1);
    expect(result.data.selected_entry?.official_id).toBe("official_1");
  });
});
