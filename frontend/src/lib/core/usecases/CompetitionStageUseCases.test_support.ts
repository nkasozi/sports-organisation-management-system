import { vi } from "vitest";

import type {
  CompetitionStage,
  CreateCompetitionStageInput,
} from "../entities/CompetitionStage";
import type { CompetitionStageRepository } from "../interfaces/ports";
import type { FixtureRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_stage_repository(): CompetitionStageRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
  } as CompetitionStageRepository;
}

export function create_mock_fixture_repository(): FixtureRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    create_many: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
    find_by_team: vi.fn(),
    find_by_round: vi.fn(),
    find_upcoming: vi.fn(),
    find_by_date_range: vi.fn(),
  } as FixtureRepository;
}

export function create_test_stage(
  overrides: Partial<ScalarInput<CompetitionStage>> = {},
): CompetitionStage {
  return {
    id: "stage-123",
    competition_id: "comp-123",
    name: "Pool Stage",
    stage_type: "group_stage",
    stage_order: 1,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as CompetitionStage;
}

export function create_valid_input(
  overrides: Partial<CreateCompetitionStageInput> = {},
): CreateCompetitionStageInput {
  return {
    competition_id: "comp-123",
    name: "Pool Stage",
    stage_type: "group_stage",
    stage_order: 1,
    status: "active",
    ...overrides,
  } as CreateCompetitionStageInput;
}
