import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const TRANSFER_ID = "transfer-123";
const PENDING_STATUS = "pending";
const APPROVED_STATUS = "approved";

describe("confirm_transfer keeps transfer status and membership consistent", () => {
  let transfer_repository: PlayerTeamTransferHistoryRepository;
  let membership_repository: PlayerTeamMembershipRepository;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    transfer_repository = create_mock_transfer_repository();
    membership_repository = create_mock_membership_repository();
    const pending_transfer = create_test_transfer({ status: PENDING_STATUS });
    vi.mocked(transfer_repository.find_by_id).mockResolvedValue({
      success: true,
      data: pending_transfer,
    });
    vi.mocked(membership_repository.find_all).mockResolvedValue({
      success: true,
      data: {
        items: [create_test_membership({ status: "active" })],
        total_count: 1,
        page_number: 1,
        page_size: 10,
        total_pages: 1,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function confirm(): ReturnType<
    ReturnType<
      typeof create_player_team_transfer_history_use_cases
    >["confirm_transfer"]
  > {
    return create_player_team_transfer_history_use_cases(
      transfer_repository,
      membership_repository,
    ).confirm_transfer(TRANSFER_ID);
  }

  it("does not move the membership when saving the approved status fails", async () => {
    vi.mocked(transfer_repository.update).mockResolvedValue({
      success: false,
      error: "write failed",
    });

    const result = await confirm();

    expect(result.success).toBe(false);
    expect(membership_repository.update).not.toHaveBeenCalled();
    expect(membership_repository.create).not.toHaveBeenCalled();
  });

  it("restores the pending status when moving the membership fails", async () => {
    vi.mocked(transfer_repository.update).mockImplementation(
      async (_id, changes) => ({
        success: true,
        data: create_test_transfer({ status: changes.status }),
      }),
    );
    vi.mocked(membership_repository.update).mockResolvedValue({
      success: false,
      error: "membership write failed",
    });

    const result = await confirm();

    expect(result.success).toBe(false);
    expect(vi.mocked(transfer_repository.update).mock.calls).toEqual([
      [TRANSFER_ID, { status: APPROVED_STATUS }],
      [TRANSFER_ID, { status: PENDING_STATUS }],
    ]);
  });
});
