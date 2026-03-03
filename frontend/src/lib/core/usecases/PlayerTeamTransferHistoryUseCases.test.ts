import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_player_team_transfer_history_use_cases } from "./PlayerTeamTransferHistoryUseCases";
import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type {
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
} from "../entities/PlayerTeamTransferHistory";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";

function create_mock_transfer_repository(): PlayerTeamTransferHistoryRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_player: vi.fn(),
    find_by_team: vi.fn(),
    find_pending_transfers: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_mock_membership_repository(): PlayerTeamMembershipRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_player: vi.fn(),
    find_by_team: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_transfer(
  overrides: Partial<PlayerTeamTransferHistory> = {},
): PlayerTeamTransferHistory {
  return {
    id: "transfer-123",
    organization_id: "org-123",
    player_id: "player-123",
    from_team_id: "team-A",
    to_team_id: "team-B",
    transfer_date: "2024-06-01",
    status: "pending",
    approved_by: "",
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_test_membership(
  overrides: Partial<PlayerTeamMembership> = {},
): PlayerTeamMembership {
  return {
    id: "membership-123",
    organization_id: "org-123",
    player_id: "player-123",
    team_id: "team-A",
    jersey_number: 10,
    start_date: "2024-01-01",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_transfer_input(
  overrides: Partial<CreatePlayerTeamTransferHistoryInput> = {},
): CreatePlayerTeamTransferHistoryInput {
  return {
    organization_id: "org-123",
    player_id: "player-456",
    from_team_id: "team-A",
    to_team_id: "team-B",
    transfer_date: "2024-06-01",
    status: "pending",
    approved_by: "",
    notes: "",
    ...overrides,
  };
}

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
      expect(result.data.length).toBe(1);
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
      expect(result.error_message).toBe("Transfer ID is required");
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
      expect(result.error_message).toContain("Player is required");
    });

    it("should fail when from_team_id equals to_team_id", async () => {
      const input = create_valid_transfer_input({
        from_team_id: "same-team",
        to_team_id: "same-team",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("cannot be the same");
    });
  });

  describe("confirm_transfer", () => {
    it("should confirm pending transfer and update membership", async () => {
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

      vi.mocked(mock_membership_repository.find_by_filter).mockResolvedValue({
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
        data: { ...existing_membership, team_id: "team-B" },
      });

      vi.mocked(mock_transfer_repository.update).mockResolvedValue({
        success: true,
        data: { ...pending_transfer, status: "confirmed" },
      });

      const result = await use_cases.confirm_transfer("transfer-123");

      expect(result.success).toBe(true);
      expect(mock_membership_repository.update).toHaveBeenCalledWith(
        "membership-123",
        {
          team_id: "team-B",
          start_date: "2024-06-01",
        },
      );
      expect(mock_transfer_repository.update).toHaveBeenCalledWith(
        "transfer-123",
        { status: "confirmed" },
      );
    });

    it("should fail to confirm already confirmed transfer", async () => {
      const confirmed_transfer = create_test_transfer({ status: "confirmed" });

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

      vi.mocked(mock_membership_repository.find_by_filter).mockResolvedValue({
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
        data: { ...pending_transfer, status: "confirmed" },
      });

      const result = await use_cases.confirm_transfer("transfer-123");

      expect(result.success).toBe(true);
      expect(mock_membership_repository.create).toHaveBeenCalledWith({
        organization_id: "org-123",
        player_id: "player-123",
        team_id: "team-B",
        start_date: "2024-06-01",
        jersey_number: null,
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

  describe("reject_transfer", () => {
    it("should reject pending transfer", async () => {
      const pending_transfer = create_test_transfer({ status: "pending" });

      vi.mocked(mock_transfer_repository.find_by_id).mockResolvedValue({
        success: true,
        data: pending_transfer,
      });

      vi.mocked(mock_transfer_repository.update).mockResolvedValue({
        success: true,
        data: { ...pending_transfer, status: "rejected" },
      });

      const result = await use_cases.reject_transfer("transfer-123");

      expect(result.success).toBe(true);
      expect(mock_transfer_repository.update).toHaveBeenCalledWith(
        "transfer-123",
        { status: "rejected" },
      );
    });

    it("should fail to reject already confirmed transfer", async () => {
      const confirmed_transfer = create_test_transfer({ status: "confirmed" });

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
      expect(result.error_message).toBe("Transfer ID is required");
    });
  });
});
