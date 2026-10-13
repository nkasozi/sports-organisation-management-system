import { vi } from "vitest";

import type {
  CreateFixtureLineupInput,
  FixtureLineup,
  LineupPlayer,
} from "../entities/FixtureLineup";
import type { FixtureLineupRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): FixtureLineupRepository {
  return {
    create: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    find_all: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_fixture: vi.fn(),
    find_by_fixture_and_team: vi.fn(),
    get_lineups_for_fixture: vi.fn(),
    get_lineup_for_team_in_fixture: vi.fn(),
  } as FixtureLineupRepository;
}

function create_test_lineup_player(
  overrides: Partial<ScalarInput<LineupPlayer>> = {},
): LineupPlayer {
  return {
    id: "player-123",
    first_name: "Test",
    last_name: "Player",
    jersey_number: 10,
    position: "Forward",
    is_captain: false,
    is_substitute: false,
    ...overrides,
  } as unknown as LineupPlayer;
}

export function create_test_lineup(
  overrides: Partial<ScalarInput<FixtureLineup>> = {},
): FixtureLineup {
  return {
    id: "lineup-123",
    organization_id: "org-123",
    fixture_id: "fixture-123",
    team_id: "team-123",
    selected_players: [create_test_lineup_player()],
    status: "draft",
    submitted_by: "",
    submitted_at: "",
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as FixtureLineup;
}

export function create_valid_input(
  overrides: Partial<CreateFixtureLineupInput> = {},
): CreateFixtureLineupInput {
  return {
    organization_id: "org-123",
    fixture_id: "fixture-123",
    team_id: "team-123",
    selected_players: [create_test_lineup_player({ id: "player-456" })],
    submitted_by: "coach-123",
    notes: "",
    ...overrides,
  } as CreateFixtureLineupInput;
}
