import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

export function make_rating(
  overrides: Partial<ScalarInput<OfficialPerformanceRating>> = {},
): OfficialPerformanceRating {
  return {
    id: "opr_001",
    organization_id: "org_1",
    official_id: "off_1",
    fixture_id: "fix_1",
    rater_user_id: "user_1",
    rater_role: "officials_manager",
    overall: 7,
    decision_accuracy: 7,
    game_control: 7,
    communication: 7,
    fitness: 7,
    notes: "",
    submitted_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as OfficialPerformanceRating;
}

export function make_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
  return {
    id: "fix_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    stage_id: "stage_1",
    home_team_id: "team_a",
    away_team_id: "team_b",
    scheduled_date: "2026-01-01",
    scheduled_time: "15:00",
    status: "completed",
    match_day: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

export function make_stage(
  overrides: Partial<ScalarInput<CompetitionStage>> = {},
): CompetitionStage {
  return {
    id: "stage_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    stage_name: "League Phase",
    stage_type: "league_stage",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as CompetitionStage;
}
