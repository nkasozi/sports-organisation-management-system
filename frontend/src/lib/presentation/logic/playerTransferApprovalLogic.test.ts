import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  apply_player_transfer_membership_change,
  delete_old_team_memberships,
  create_new_team_membership,
  type TransferApprovalDetails,
} from "./playerTransferApprovalLogic";
import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";

function create_mock_use_cases(): PlayerTeamMembershipUseCases {
  return {
    list: vi.fn(),
    get_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list_memberships_by_team: vi.fn(),
    list_memberships_by_player: vi.fn(),
    delete_memberships: vi.fn(),
  };
}

function create_test_membership(
  overrides: Partial<PlayerTeamMembership> = {},
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
  };
}

function create_test_transfer(
  overrides: Partial<TransferApprovalDetails> = {},
): TransferApprovalDetails {
  return {
    player_id: "player-1",
    from_team_id: "team-A",
    to_team_id: "team-B",
    organization_id: "org-1",
    transfer_date: "2026-03-11",
    ...overrides,
  };
}

function make_paginated_response(items: PlayerTeamMembership[]) {
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

      await create_new_team_membership(mock_use_cases, {
        ...create_test_transfer(),
        transfer_date: "",
      });

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

    it("fails with descriptive error when list_memberships fails", async () => {
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
      expect(result.error).toContain("Network error");
      expect(mock_use_cases.create).not.toHaveBeenCalled();
    });

    it("fails with descriptive error when create fails after successful delete", async () => {
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
      expect(result.error).toContain("Duplicate membership");
    });

    it("succeeds even when player has no existing membership for from_team", async () => {
      vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
        make_paginated_response([]),
      );
      vi.mocked(mock_use_cases.create).mockResolvedValue({
        success: true,
        data: create_new_membership_entity("m-new", "team-B"),
      });

      const result = await apply_player_transfer_membership_change(
        mock_use_cases,
        create_test_transfer(),
      );

      expect(result.success).toBe(true);
      expect(mock_use_cases.delete_memberships).not.toHaveBeenCalled();
      expect(mock_use_cases.create).toHaveBeenCalled();
    });
  });
});

function create_new_membership_entity(
  id: string,
  team_id: string,
): PlayerTeamMembership {
  return create_test_membership({ id, team_id });
}
