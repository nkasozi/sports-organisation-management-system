import { vi } from "vitest";

import type { CreateFixtureInput, Fixture } from "../entities/Fixture";
import type { FixtureRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): FixtureRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_competition: vi.fn(),
    find_by_team: vi.fn(),
    find_by_round: vi.fn(),
    find_upcoming: vi.fn(),
    create_many: vi.fn(),
    find_by_date_range: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  } as FixtureRepository;
}

export function create_test_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
  return {
    id: "fixture-123",
    organization_id: "org-123",
    competition_id: "comp-123",
    home_team_id: "team-1",
    away_team_id: "team-2",
    venue: "venue-123",
    scheduled_date: "2024-06-15",
    scheduled_time: "15:00",
    round_number: 1,
    round_name: "Round 1",
    match_day: 1,
    stage_id: "stage-1",
    status: "scheduled",
    home_team_score: 0,
    away_team_score: 0,
    game_events: [],
    assigned_officials: [],
    current_period: "pre_game" as const,
    current_minute: 0,
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

export function create_valid_input(
  overrides: Partial<CreateFixtureInput> = {},
): CreateFixtureInput {
  return {
    organization_id: "org-123",
    competition_id: "comp-123",
    home_team_id: "team-1",
    away_team_id: "team-2",
    venue: "venue-123",
    scheduled_date: "2024-06-15",
    scheduled_time: "15:00",
    round_number: 1,
    round_name: "Round 1",
    match_day: 1,
    stage_id: "stage-1",
    status: "scheduled",
    assigned_officials: [],
    notes: "",
    ...overrides,
  } as CreateFixtureInput;
}
