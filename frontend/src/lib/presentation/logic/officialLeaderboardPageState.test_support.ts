import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type { Organization } from "$lib/core/entities/Organization";
import { type UserScopeProfile } from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

export function create_profile(
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

export function create_organization(
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

export function create_official(
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

export function create_fixture(
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
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

export function create_stage(
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

export function create_rating(
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
