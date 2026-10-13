import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import { create_player_team_transfer_history_use_cases } from "./PlayerTeamTransferHistoryUseCases";
import {
  create_mock_membership_repository,
  create_mock_transfer_repository,
  create_test_transfer,
} from "./PlayerTeamTransferHistoryUseCases.test_support";

describe("PlayerTeamTransferHistoryUseCases", () => {
  let mock_transfer_repository: PlayerTeamTransferHistoryRepository;
  let mock_membership_repository: PlayerTeamMembershipRepository;
  let use_cases: ReturnType<
    typeof create_player_team_transfer_history_use_cases
  >;

  beforeEach(() => {
    mock_transfer_repository = create_mock_transfer_repository();
    mock_membership_repository = create_mock_membership_repository();
    use_cases = create_player_team_transfer_history_use_cases(
      mock_transfer_repository,
      mock_membership_repository,
    );
  });

  describe("reject_transfer", () => {
    it("should reject pending transfer", async () => {
      const pending_transfer = create_test_transfer({ status: "pending" });

      vi.mocked(mock_transfer_repository.find_by_id).mockResolvedValue({
        success: true,
        data: pending_transfer,
      });

      vi.mocked(mock_transfer_repository.update).mockResolvedValue({
        success: true,
        data: { ...pending_transfer, status: "declined" },
      });

      const result = await use_cases.reject_transfer("transfer-123");

      expect(result.success).toBe(true);
      expect(mock_transfer_repository.update).toHaveBeenCalledWith(
        "transfer-123",
        { status: "declined" },
      );
    });

    it("should fail to reject already confirmed transfer", async () => {
      const confirmed_transfer = create_test_transfer({ status: "approved" });

      vi.mocked(mock_transfer_repository.find_by_id).mockResolvedValue({
        success: true,
        data: confirmed_transfer,
      });

      const result = await use_cases.reject_transfer("transfer-123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("cannot be rejected");
      }
    });
  });

  describe("delete", () => {
    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Transfer ID is required");
    });
  });
});
