import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  PlayerTeamMembershipRepository,
  PlayerTeamTransferHistoryRepository,
} from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_team_transfer_history_use_cases } from "./PlayerTeamTransferHistoryUseCases";
import {
  create_mock_membership_repository,
  create_mock_transfer_repository,
  create_test_membership,
  create_test_transfer,
} from "./PlayerTeamTransferHistoryUseCases.test_support";

const mocks = vi.hoisted(() => ({ emit_entity_deleted: vi.fn() }));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: {
    emit_entity_deleted: mocks.emit_entity_deleted,
    emit_entity_updated: vi.fn(),
    emit_entity_created: vi.fn(),
  },
}));

describe("PlayerTeamTransferHistoryUseCases failure logging", () => {
  let transfer_repository: PlayerTeamTransferHistoryRepository;
  let membership_repository: PlayerTeamMembershipRepository;

  beforeEach(() => {
    transfer_repository = create_mock_transfer_repository();
    membership_repository = create_mock_membership_repository();
    mocks.emit_entity_deleted.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function use_cases(): ReturnType<
    typeof create_player_team_transfer_history_use_cases
  > {
    return create_player_team_transfer_history_use_cases(
      transfer_repository,
      membership_repository,
    );
  }

  it("stops confirming and hides the error when the membership move fails", async () => {
    vi.mocked(transfer_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_transfer(),
    });
    vi.mocked(membership_repository.find_all).mockResolvedValue({
      success: true,
      data: {
        items: [create_test_membership()],
        total_count: 1,
        page_number: 1,
        page_size: 10,
        total_pages: 1,
      },
    });
    vi.mocked(membership_repository.update).mockResolvedValue({
      success: false,
      error: "ConstraintError: key exists",
    });
    vi.mocked(transfer_repository.update).mockImplementation(
      async (_id, changes) => ({
        success: true,
        data: create_test_transfer({ status: changes.status }),
      }),
    );

    const result = await use_cases().confirm_transfer("transfer-123");

    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(vi.mocked(transfer_repository.update).mock.calls).toEqual([
      ["transfer-123", { status: "approved" }],
      ["transfer-123", { status: "pending" }],
    ]);
    expect(console.error).toHaveBeenCalledWith(
      "[PlayerTeamTransferHistoryUseCases]",
      {
        event: "transfer_membership_update_failed",
        error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
        technical_detail: "ConstraintError: key exists",
        transfer_id: "transfer-123",
        membership_id: "membership-123",
      },
    );
  });

  it("reports a missing transfer with a friendly message", async () => {
    vi.mocked(transfer_repository.find_by_id).mockResolvedValue({
      success: false,
      error: "Entity with id 'transfer-404' not found",
    });

    const result = await use_cases().reject_transfer("transfer-404");

    expect(result).toEqual({ success: false, error: "Transfer not found" });
  });

  it("warns about transfers whose snapshot is unavailable after bulk delete", async () => {
    vi.mocked(transfer_repository.find_by_id)
      .mockResolvedValueOnce({ success: true, data: create_test_transfer() })
      .mockResolvedValueOnce({ success: false, error: "missing" });
    vi.mocked(transfer_repository.delete_by_ids).mockResolvedValue({
      success: true,
      data: 2,
    });

    const result = await use_cases().delete_transfers(["transfer-123", "t-2"]);

    expect(result).toEqual({ success: true, data: 2 });
    expect(mocks.emit_entity_deleted).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "[PlayerTeamTransferHistoryUseCases]",
      {
        event: "transfer_bulk_delete_snapshot_unavailable",
        transfer_id: "t-2",
        technical_detail: "missing",
      },
    );
  });
});
