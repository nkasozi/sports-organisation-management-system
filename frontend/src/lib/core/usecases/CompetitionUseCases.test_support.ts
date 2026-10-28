import { vi } from "vitest";

import type {
  Competition,
  CreateCompetitionInput,
} from "../entities/Competition";
import type { CompetitionRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { CompetitionStageLifecyclePort } from "./CompetitionUseCases";

export function create_mock_repository(): CompetitionRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_organization: vi.fn(),
    find_active_competitions: vi.fn(),
  } as CompetitionRepository;
}

export function create_test_competition(
  overrides: Partial<ScalarInput<Competition>> = {},
): Competition {
  return {
    id: "comp-123",
    name: "Test League",
    description: "Test Description",
    organization_id: "org-123",
    competition_format_id: "format-123",
    team_ids: [],
    allow_auto_squad_submission: false,
    squad_generation_strategy: "first_available",
    allow_auto_fixture_details_setup: false,
    lineup_submission_deadline_hours: 2,
    max_event_edits_per_game: 3,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    registration_deadline: "2023-12-31",
    max_teams: 16,
    entry_fee: 0,
    prize_pool: 0,
    location: "Test Location",
    rule_overrides: {},
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Competition;
}

export function create_valid_input(
  overrides: Partial<CreateCompetitionInput> = {},
): CreateCompetitionInput {
  return {
    name: "New Competition",
    description: "New Description",
    organization_id: "org-123",
    competition_format_id: "format-123",
    team_ids: [],
    allow_auto_squad_submission: false,
    squad_generation_strategy: "first_available",
    allow_auto_fixture_details_setup: false,
    lineup_submission_deadline_hours: 2,
    max_event_edits_per_game: 3,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    registration_deadline: "2023-12-31",
    max_teams: 16,
    entry_fee: 0,
    prize_pool: 0,
    location: "Test Location",
    rule_overrides: {},
    status: "active",
    ...overrides,
  } as CreateCompetitionInput;
}

export function create_mock_stage_lifecycle(): CompetitionStageLifecyclePort {
  return {
    ensure_stages_for_competition: vi.fn().mockResolvedValue({
      success: true,
      data: true,
    }),
    can_replace_stages_for_competition: vi.fn().mockResolvedValue({
      success: true,
      data: true,
    }),
    replace_stages_for_competition: vi.fn().mockResolvedValue({
      success: true,
      data: true,
    }),
  };
}
