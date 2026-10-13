import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import {
  apply_player_transfer_membership_change,
  create_new_team_membership,
} from "./playerTransferApprovalLogic";
import {
  create_mock_use_cases,
  create_new_membership_entity,
  create_test_membership,
  create_test_transfer,
  make_paginated_response,
} from "./playerTransferApprovalLogic.test_support";
import { PLAYER_TRANSFER_USER_MESSAGE } from "./playerTransferMessages";

describe("playerTransferApprovalLogic", () => {
  let mock_use_cases: PlayerTeamMembershipUseCases;

  beforeEach(() => {
    mock_use_cases = create_mock_use_cases();
  });

  describe("create_new_team_membership", () => {
    it("creates membership with transfer details", async () => {
      const new_membership = create_test_membership({
        id: "m-new",
        team_id: "team-B",
      });
      vi.mocked(mock_use_cases.create).mockResolvedValue({
        success: true,
        data: new_membership,
      });

      const result = await create_new_team_membership(
        mock_use_cases,
        create_test_transfer(),
      );

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBe("m-new");
      expect(mock_use_cases.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player_id: "player-1",
          team_id: "team-B",
          organization_id: "org-1",
          start_date: "2026-03-11",
          status: "active",
        }),
      );
    });

    it("uses today as start_date when transfer_date is empty", async () => {
      const today = new Date().toISOString().split("T")[0];
      vi.mocked(mock_use_cases.create).mockResolvedValue({
        success: true,
        data: create_test_membership({ id: "m-new" }),
      });

      const result = await create_new_team_membership(mock_use_cases, {
        ...create_test_transfer(),
        transfer_date: "",
      });

      expect(result.success).toBe(true);
      expect(mock_use_cases.create).toHaveBeenCalledWith(
        expect.objectContaining({ start_date: today }),
      );
    });

    it("fails when create returns an error", async () => {
      vi.mocked(mock_use_cases.create).mockResolvedValue({
        success: false,
        error: "Validation failed",
      });

      const result = await create_new_team_membership(
        mock_use_cases,
        create_test_transfer(),
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Validation failed");
    });
  });

  describe("apply_player_transfer_membership_change", () => {
    it("deletes old membership then creates new one on success", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([
          create_test_membership({ id: "m-old", team_id: "team-A" }),
        ]),
      );
      vi.mocked(mock_use_cases.delete_memberships).mockResolvedValue({
        success: true,
        data: 1,
      });
      vi.mocked(mock_use_cases.create).mockResolvedValue({
        success: true,
        data: create_new_membership_entity("m-new", "team-B"),
      });

      const result = await apply_player_transfer_membership_change(
        mock_use_cases,
        create_test_transfer(),
      );

      expect(result.success).toBe(true);
      expect(mock_use_cases.delete_memberships).toHaveBeenCalledWith(["m-old"]);
      expect(mock_use_cases.create).toHaveBeenCalledWith(
        expect.objectContaining({ team_id: "team-B" }),
      );
    });

    it("does NOT create new membership when delete fails", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([
          create_test_membership({ id: "m-old", team_id: "team-A" }),
        ]),
      );
      vi.mocked(mock_use_cases.delete_memberships).mockResolvedValue({
        success: false,
        error: "DB error",
      });

      const result = await apply_player_transfer_membership_change(
        mock_use_cases,
        create_test_transfer(),
      );

      expect(result.success).toBe(false);
      expect(mock_use_cases.create).not.toHaveBeenCalled();
    });

    it("fails with a friendly message when list_memberships fails", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue({
        success: false,
        error: "Network error",
      });

      const result = await apply_player_transfer_membership_change(
        mock_use_cases,
        create_test_transfer(),
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        PLAYER_TRANSFER_USER_MESSAGE.OLD_MEMBERSHIP_REMOVAL_FAILED,
      );
      expect(mock_use_cases.create).not.toHaveBeenCalled();
    });

    it("fails with a friendly message when create fails after successful delete", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([
          create_test_membership({ id: "m-old", team_id: "team-A" }),
        ]),
      );
      vi.mocked(mock_use_cases.delete_memberships).mockResolvedValue({
        success: true,
        data: 1,
      });
      vi.mocked(mock_use_cases.create).mockResolvedValue({
        success: false,
        error: "Duplicate membership",
      });

      const result = await apply_player_transfer_membership_change(
        mock_use_cases,
        create_test_transfer(),
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        PLAYER_TRANSFER_USER_MESSAGE.NEW_MEMBERSHIP_CREATION_FAILED,
      );
      expect(result.error).not.toContain("Duplicate membership");
    });
  });
});
