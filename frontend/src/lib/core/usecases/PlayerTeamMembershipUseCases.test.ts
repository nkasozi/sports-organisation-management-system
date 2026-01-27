import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_player_team_membership_use_cases } from "./PlayerTeamMembershipUseCases";
import type { PlayerTeamMembershipRepository } from "../interfaces/adapters/PlayerTeamMembershipRepository";
import type {
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
} from "../entities/PlayerTeamMembership";

function create_mock_repository(): PlayerTeamMembershipRepository {
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

function create_test_membership(
  overrides: Partial<PlayerTeamMembership> = {},
): PlayerTeamMembership {
  return {
    id: "membership-123",
    player_id: "player-123",
    team_id: "team-123",
    jersey_number: 10,
    start_date: "2024-01-01",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreatePlayerTeamMembershipInput> = {},
): CreatePlayerTeamMembershipInput {
  return {
    player_id: "player-456",
    team_id: "team-123",
    jersey_number: 7,
    start_date: "2024-01-01",
    status: "active",
    ...overrides,
  };
}

describe("PlayerTeamMembershipUseCases", () => {
  let mock_repository: PlayerTeamMembershipRepository;
  let use_cases: ReturnType<typeof create_player_team_membership_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_team_membership_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all memberships when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_membership()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
    });
  });

  describe("get_by_id", () => {
    it("should return membership when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_membership(),
      });

      const result = await use_cases.get_by_id("membership-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_membership(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty player_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ player_id: "" }),
      );

      expect(result.success).toBe(false);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ team_id: "" }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_membership(),
      });

      const result = await use_cases.update("membership-123", {
        jersey_number: 9,
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { jersey_number: 9 });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("membership-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_memberships_by_player", () => {
    it("should return memberships for player", async () => {
      vi.mocked(mock_repository.find_by_player).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_membership()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_memberships_by_player("player-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty player_id", async () => {
      const result = await use_cases.list_memberships_by_player("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_memberships_by_team", () => {
    it("should return memberships for team", async () => {
      vi.mocked(mock_repository.find_by_team).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_membership()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_memberships_by_team("team-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.list_memberships_by_team("");

      expect(result.success).toBe(false);
    });
  });
});
