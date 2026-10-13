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

describe("confirm_transfer membership rules", () => {
  let transfers: PlayerTeamTransferHistoryRepository;
  let memberships: PlayerTeamMembershipRepository;

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

  it("looks up every active membership of the player", async () => {
    vi.mocked(memberships.find_all).mockResolvedValue(page_of([]));
    vi.mocked(memberships.create).mockResolvedValue({
      success: true,
      data: create_test_membership({ id: "new", team_id: "team-B" }),
    });
    const result = await confirm();
    expect(result.success).toBe(true);
    expect(memberships.find_all).toHaveBeenCalledWith({
      player_id: "player-123",
      status: "active",
    });
  });

  it("refuses and rolls back when the player is active on a team other than the from team", async () => {
    vi.mocked(memberships.find_all).mockResolvedValue(
      page_of([create_test_membership({ team_id: "team-C" })]),
    );
    const result = await confirm();
    expect(result.success).toBe(false);
    expect(memberships.create).not.toHaveBeenCalled();
    expect(memberships.update).not.toHaveBeenCalled();
    expect(transfers.update).toHaveBeenLastCalledWith("transfer-123", {
      status: "pending",
    });
  });

  it("does not create a duplicate when the player is already active on the destination team", async () => {
    vi.mocked(memberships.find_all).mockResolvedValue(
      page_of([create_test_membership({ team_id: "team-B" })]),
    );
    const result = await confirm();
    expect(result.success).toBe(true);
    expect(memberships.create).not.toHaveBeenCalled();
    expect(memberships.update).not.toHaveBeenCalled();
  });
});
