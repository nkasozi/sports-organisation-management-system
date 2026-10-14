import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import { create_player_team_transfer_history_use_cases } from "./PlayerTeamTransferHistoryUseCases";
import {
  create_mock_membership_repository,
  create_mock_transfer_repository,
  create_test_membership,
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

  describe("confirm_transfer", () => {
    it("should confirm pending transfer, end the old membership and create the new one", async () => {
      const pending_transfer = create_test_transfer({ status: "pending" });
      const existing_membership = create_test_membership({
        player_id: "player-123",
        team_id: "team-A",
        status: "active",
      });

      vi.mocked(mock_transfer_repository.find_by_id).mockResolvedValue({
        success: true,
        data: pending_transfer,
      });

      vi.mocked(mock_membership_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [existing_membership],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      vi.mocked(mock_membership_repository.update).mockResolvedValue({
        success: true,
        data: {
          ...existing_membership,
          status: "ended",
        } as unknown as PlayerTeamMembership,
      });
      vi.mocked(mock_membership_repository.create).mockResolvedValue({
        success: true,
        data: {
          ...existing_membership,
          id: "membership-new",
          team_id: "team-B",
        } as unknown as PlayerTeamMembership,
      });

      vi.mocked(mock_transfer_repository.update).mockResolvedValue({
        success: true,
        data: { ...pending_transfer, status: "approved" },
      });

      const result = await use_cases.confirm_transfer("transfer-123");

      expect(result.success).toBe(true);
      expect(mock_membership_repository.update).toHaveBeenCalledWith(
        "membership-123",
        { status: "ended" },
      );
      expect(mock_membership_repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          team_id: "team-B",
          start_date: "2024-06-01",
        }),
      );
      expect(mock_transfer_repository.update).toHaveBeenCalledWith(
        "transfer-123",
        { status: "approved" },
      );
    });

    it("should fail to confirm already confirmed transfer", async () => {
      const confirmed_transfer = create_test_transfer({ status: "approved" });

      vi.mocked(mock_transfer_repository.find_by_id).mockResolvedValue({
        success: true,
        data: confirmed_transfer,
      });

      const result = await use_cases.confirm_transfer("transfer-123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("cannot be confirmed");
      }
    });

    it("should create new membership when no active membership exists", async () => {
      const pending_transfer = create_test_transfer({ status: "pending" });

      vi.mocked(mock_transfer_repository.find_by_id).mockResolvedValue({
        success: true,
        data: pending_transfer,
      });

      vi.mocked(mock_membership_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 10,
          total_pages: 0,
        },
      });

      vi.mocked(mock_membership_repository.create).mockResolvedValue({
        success: true,
        data: create_test_membership({ team_id: "team-B" }),
      });

      vi.mocked(mock_transfer_repository.update).mockResolvedValue({
        success: true,
        data: { ...pending_transfer, status: "approved" },
      });

      const result = await use_cases.confirm_transfer("transfer-123");

      expect(result.success).toBe(true);
      expect(mock_membership_repository.create).toHaveBeenCalledWith({
        organization_id: "org-123",
        player_id: "player-123",
        team_id: "team-B",
        start_date: "2024-06-01",
        jersey_number: 0,
        status: "active",
      });
    });

    it("should fail for empty transfer id", async () => {
      const result = await use_cases.confirm_transfer("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Transfer ID is required");
      }
    });
  });
});
