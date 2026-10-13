import { vi } from "vitest";

import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
} from "../entities/PlayerTeamMembership";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";

export function create_mock_repository(): PlayerTeamMembershipRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_player: vi.fn(),
    find_by_team: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  } as PlayerTeamMembershipRepository;
}

export function create_test_membership(
  overrides: Partial<PlayerTeamMembership> = {},
): PlayerTeamMembership {
  return {
    id: "membership-123",
    organization_id: "org-123",
    player_id: "player-123",
    team_id: "team-123",
    jersey_number: 10,
    start_date: "2024-01-01",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as PlayerTeamMembership;
}

export function create_valid_input(
  overrides: Partial<CreatePlayerTeamMembershipInput> = {},
): CreatePlayerTeamMembershipInput {
  return {
    organization_id: "org-123",
    player_id: "player-456",
    team_id: "team-123",
    jersey_number: 7,
    start_date: "2024-01-01",
    status: "active",
    ...overrides,
  } as CreatePlayerTeamMembershipInput;
}
