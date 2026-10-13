import { vi } from "vitest";

import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
} from "../entities/CompetitionTeam";
import type { CompetitionTeamRepository } from "../interfaces/ports";

export function create_mock_repository(): CompetitionTeamRepository {
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
    find_by_team: vi.fn(),
    find_team_in_competition: vi.fn(),
    remove_team_from_competition: vi.fn(),
  } as CompetitionTeamRepository;
}

export function create_test_competition_team(
  overrides: Partial<CompetitionTeam> = {},
): CompetitionTeam {
  return {
    id: "comp-team-123",
    competition_id: "comp-123",
    team_id: "team-123",
    registration_date: "2024-01-01",
    seed_number: 1,
    group_name: "Group A",
    points: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    matches_played: 0,
    matches_won: 0,
    matches_drawn: 0,
    matches_lost: 0,
    notes: "",
    status: "registered",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as CompetitionTeam;
}

export function create_valid_input(
  overrides: Partial<CreateCompetitionTeamInput> = {},
): CreateCompetitionTeamInput {
  return {
    competition_id: "comp-123",
    team_id: "team-456",
    registration_date: "2024-01-01",
    seed_number: 2,
    group_name: "Group B",
    notes: "",
    status: "registered",
    ...overrides,
  } as CreateCompetitionTeamInput;
}
