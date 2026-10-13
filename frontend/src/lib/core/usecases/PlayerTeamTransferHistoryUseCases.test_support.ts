import { vi } from "vitest";

import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type {
  CreatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistory,
} from "../entities/PlayerTeamTransferHistory";
import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_transfer_repository(): PlayerTeamTransferHistoryRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_player: vi.fn(),
    find_by_team: vi.fn(),
    find_pending_transfers: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  } as PlayerTeamTransferHistoryRepository;
}

export function create_mock_membership_repository(): PlayerTeamMembershipRepository {
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

export function create_test_transfer(
  overrides: Partial<ScalarInput<PlayerTeamTransferHistory>> = {},
): PlayerTeamTransferHistory {
  return {
    id: "transfer-123",
    organization_id: "org-123",
    player_id: "player-123",
    from_team_id: "team-A",
    to_team_id: "team-B",
    transfer_date: "2024-06-01",
    status: "pending",
    approved_by: "",
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerTeamTransferHistory;
}

export function create_test_membership(
  overrides: Partial<ScalarInput<PlayerTeamMembership>> = {},
): PlayerTeamMembership {
  return {
    id: "membership-123",
    organization_id: "org-123",
    player_id: "player-123",
    team_id: "team-A",
    jersey_number: 10,
    start_date: "2024-01-01",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerTeamMembership;
}

export function create_valid_transfer_input(
  overrides: Partial<CreatePlayerTeamTransferHistoryInput> = {},
): CreatePlayerTeamTransferHistoryInput {
  return {
    organization_id: "org-123",
    player_id: "player-456",
    from_team_id: "team-A",
    to_team_id: "team-B",
    transfer_date: "2024-06-01",
    status: "pending",
    approved_by: "",
    notes: "",
    ...overrides,
  } as CreatePlayerTeamTransferHistoryInput;
}
