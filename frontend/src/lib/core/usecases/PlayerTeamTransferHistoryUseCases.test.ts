import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import { create_player_team_transfer_history_use_cases } from "./PlayerTeamTransferHistoryUseCases";
import {
  create_mock_membership_repository,
  create_mock_transfer_repository,
  create_test_transfer,
  create_valid_transfer_input,
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

  describe("list", () => {
    it("should return all transfers when no filter provided", async () => {
      vi.mocked(mock_transfer_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_transfer()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
    });
  });

  describe("get_by_id", () => {
    it("should return transfer when found", async () => {
      vi.mocked(mock_transfer_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_transfer(),
      });

      const result = await use_cases.get_by_id("transfer-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Transfer ID is required");
    });
  });

  describe("create", () => {
    it("should create transfer with valid input", async () => {
      const input = create_valid_transfer_input();
      const expected_transfer = create_test_transfer({
        ...input,
        id: "new-transfer",
      });

      vi.mocked(mock_transfer_repository.create).mockResolvedValue({
        success: true,
        data: expected_transfer,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(mock_transfer_repository.create).toHaveBeenCalledWith(input);
    });

    it("should fail when player_id is missing", async () => {
      const input = create_valid_transfer_input({ player_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Player is required");
    });

    it("should fail when from_team_id equals to_team_id", async () => {
      const input = create_valid_transfer_input({
        from_team_id: "same-team",
        to_team_id: "same-team",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("cannot be the same");
    });
  });
});
