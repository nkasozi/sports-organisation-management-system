import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import { delete_old_team_memberships } from "./playerTransferApprovalLogic";
import {
  create_mock_use_cases,
  create_test_membership,
  make_paginated_response,
} from "./playerTransferApprovalLogic.test_support";

describe("playerTransferApprovalLogic", () => {
  let mock_use_cases: PlayerTeamMembershipUseCases;

  beforeEach(() => {
    mock_use_cases = create_mock_use_cases();
  });

  describe("delete_old_team_memberships", () => {
    it("deletes memberships matching from_team_id and returns count", async () => {
      const matching = create_test_membership({ id: "m-1", team_id: "team-A" });
      const non_matching = create_test_membership({
        id: "m-2",
        team_id: "team-C",
      });
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([matching, non_matching]),
      );
      vi.mocked(mock_use_cases.delete_memberships).mockResolvedValue({
        success: true,
        data: 1,
      });

      const result = await delete_old_team_memberships(
        mock_use_cases,
        "player-1",
        "team-A",
      );

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBe(1);
      expect(mock_use_cases.delete_memberships).toHaveBeenCalledWith(["m-1"]);
    });

    it("succeeds with count 0 when no matching memberships exist", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([
          create_test_membership({ team_id: "team-C" }),
        ]),
      );

      const result = await delete_old_team_memberships(
        mock_use_cases,
        "player-1",
        "team-A",
      );

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBe(0);
      expect(mock_use_cases.delete_memberships).not.toHaveBeenCalled();
    });

    it("succeeds with count 0 when player has no memberships at all", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([]),
      );

      const result = await delete_old_team_memberships(
        mock_use_cases,
        "player-1",
        "team-A",
      );

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBe(0);
    });

    it("deletes all multiple matching memberships for the same from_team", async () => {
      const m1 = create_test_membership({ id: "m-1", team_id: "team-A" });
      const m2 = create_test_membership({ id: "m-2", team_id: "team-A" });
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([m1, m2]),
      );
      vi.mocked(mock_use_cases.delete_memberships).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await delete_old_team_memberships(
        mock_use_cases,
        "player-1",
        "team-A",
      );

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBe(2);
      expect(mock_use_cases.delete_memberships).toHaveBeenCalledWith([
        "m-1",
        "m-2",
      ]);
    });

    it("fails when list_memberships_by_player returns an error", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue({
        success: false,
        error: "DB connection failed",
      });

      const result = await delete_old_team_memberships(
        mock_use_cases,
        "player-1",
        "team-A",
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("DB connection failed");
    });

    it("fails when delete_memberships returns an error", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([
          create_test_membership({ id: "m-1", team_id: "team-A" }),
        ]),
      );
      vi.mocked(mock_use_cases.delete_memberships).mockResolvedValue({
        success: false,
        error: "Delete failed",
      });

      const result = await delete_old_team_memberships(
        mock_use_cases,
        "player-1",
        "team-A",
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Delete failed");
    });
  });
});
