import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamTransferHistoryRepository,
} from "../interfaces/ports";
import { create_player_team_transfer_history_use_cases } from "./PlayerTeamTransferHistoryUseCases";
import {
  create_mock_membership_repository,
  create_mock_transfer_repository,
  create_test_membership,
  create_test_transfer,
} from "./PlayerTeamTransferHistoryUseCases.test_support";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn(), emit_entity_created: vi.fn() },
}));

function page_of(items: PlayerTeamMembership[]): never {
  return {
    success: true,
    data: {
      items,
      total_count: items.length,
      page_number: 1,
      page_size: 10,
      total_pages: 1,
    },
  } as never;
}

describe("confirm_transfer keeps membership history", () => {
  let transfers: PlayerTeamTransferHistoryRepository;
  let memberships: PlayerTeamMembershipRepository;
  const from_membership = create_test_membership({
    id: "from-membership",
    team_id: "team-A",
    jersey_number: 10,
  });

  beforeEach(() => {
    transfers = create_mock_transfer_repository();
    memberships = create_mock_membership_repository();
    const pending = create_test_transfer({ status: "pending" });
    vi.mocked(transfers.find_by_id).mockResolvedValue({
      success: true,
      data: pending,
    });
    vi.mocked(transfers.update).mockImplementation(async (_id, updates) => ({
      success: true,
      data: { ...pending, ...updates } as never,
    }));
    vi.mocked(memberships.update).mockImplementation(async (id, updates) => ({
      success: true,
      data: { ...from_membership, id: String(id), ...updates } as never,
    }));
    vi.mocked(memberships.create).mockImplementation(async (input) => ({
      success: true,
      data: { ...from_membership, ...input, id: "new-membership" } as never,
    }));
  });

  function confirm(): ReturnType<
    ReturnType<
      typeof create_player_team_transfer_history_use_cases
    >["confirm_transfer"]
  > {
    return create_player_team_transfer_history_use_cases(
      transfers,
      memberships,
    ).confirm_transfer("transfer-123");
  }

  it("ends the from-team membership instead of rewriting its team", async () => {
    vi.mocked(memberships.find_all).mockResolvedValue(
      page_of([from_membership]),
    );
    const result = await confirm();
    expect(result.success).toBe(true);
    expect(memberships.update).toHaveBeenCalledWith("from-membership", {
      status: "ended",
    });
    expect(memberships.update).not.toHaveBeenCalledWith(
      "from-membership",
      expect.objectContaining({ team_id: "team-B" }),
    );
  });

  it("creates a fresh destination membership without carrying the old jersey number", async () => {
    vi.mocked(memberships.find_all).mockResolvedValue(
      page_of([from_membership]),
    );
    const result = await confirm();
    expect(result.success).toBe(true);
    expect(memberships.create).toHaveBeenCalledWith(
      expect.objectContaining({
        team_id: "team-B",
        player_id: "player-123",
        start_date: "2024-06-01",
        status: "active",
        jersey_number: 0,
      }),
    );
  });

  it("only ends the from-team membership when the player is already active on the destination", async () => {
    vi.mocked(memberships.find_all).mockResolvedValue(
      page_of([
        from_membership,
        create_test_membership({ id: "dest", team_id: "team-B" }),
      ]),
    );
    const result = await confirm();
    expect(result.success).toBe(true);
    expect(memberships.create).not.toHaveBeenCalled();
    expect(memberships.update).toHaveBeenCalledTimes(1);
    expect(memberships.update).toHaveBeenCalledWith("from-membership", {
      status: "ended",
    });
  });

  it("reactivates the from-team membership and fails when the destination cannot be created", async () => {
    vi.mocked(memberships.find_all).mockResolvedValue(
      page_of([from_membership]),
    );
    vi.mocked(memberships.create).mockResolvedValue({
      success: false,
      error: "write failed",
    });
    const result = await confirm();
    expect(result.success).toBe(false);
    expect(vi.mocked(memberships.update).mock.calls).toEqual([
      ["from-membership", { status: "ended" }],
      ["from-membership", { status: "active" }],
    ]);
  });
});
