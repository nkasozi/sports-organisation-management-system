import { vi } from "vitest";

import type { PaginatedResult } from "$lib/core/types/Result";

import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";
import type { ScalarInput } from "../../core/types/DomainScalars";
import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import { type TransferApprovalDetails } from "./playerTransferApprovalLogic";

export function create_mock_use_cases(): PlayerTeamMembershipUseCases {
  return {
    list: vi.fn(),
    get_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list_memberships_by_team: vi.fn(),
    list_memberships_by_player: vi.fn(),
    delete_memberships: vi.fn(),
  } as PlayerTeamMembershipUseCases;
}

export function create_test_membership(
  overrides: Partial<ScalarInput<PlayerTeamMembership>> = {},
): PlayerTeamMembership {
  return {
    id: "membership-1",
    organization_id: "org-1",
    player_id: "player-1",
    team_id: "team-A",
    jersey_number: 10,
    start_date: "2024-01-01",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as PlayerTeamMembership;
}

export function create_test_transfer(
  overrides: Partial<TransferApprovalDetails> = {},
): TransferApprovalDetails {
  return {
    player_id: "player-1",
    from_team_id: "team-A",
    to_team_id: "team-B",
    organization_id: "org-1",
    transfer_date: "2026-03-11",
    ...overrides,
  } as TransferApprovalDetails;
}

export function make_paginated_response(items: PlayerTeamMembership[]): {
  success: true;
  data: PaginatedResult<PlayerTeamMembership>;
} {
  return {
    success: true as const,
    data: {
      items,
      total_count: items.length,
      page_number: 1,
      page_size: 100,
      total_pages: 1,
    },
  };
}

export function create_new_membership_entity(
  id: string,
  team_id: string,
): PlayerTeamMembership {
  return create_test_membership({ id, team_id });
}
