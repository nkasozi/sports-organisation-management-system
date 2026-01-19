import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_game_official_role_use_cases } from "./GameOfficialRoleUseCases";
import type { GameOfficialRoleRepository } from "../interfaces/adapters/GameOfficialRoleRepository";
import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
} from "../entities/GameOfficialRole";

function create_mock_repository(): GameOfficialRoleRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_sport: vi.fn(),
    find_head_officials: vi.fn(),
  };
}

function create_test_role(
  overrides: Partial<GameOfficialRole> = {},
): GameOfficialRole {
  return {
    id: "role-123",
    name: "Referee",
    code: "REF",
    description: "Main match official",
    sport_id: "sport-123",
    is_on_field: true,
    is_head_official: true,
    display_order: 1,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateGameOfficialRoleInput> = {},
): CreateGameOfficialRoleInput {
  return {
    name: "Assistant Referee",
    code: "AR",
    description: "Assists main referee",
    sport_id: "sport-123",
    is_on_field: true,
    is_head_official: false,
    display_order: 2,
    status: "active",
    ...overrides,
  };
}

describe("GameOfficialRoleUseCases", () => {
  let mock_repository: GameOfficialRoleRepository;
  let use_cases: ReturnType<typeof create_game_official_role_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_official_role_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all roles when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_role()],
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
    it("should return role when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_role(),
      });

      const result = await use_cases.get_by_id("role-123");

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
        data: create_test_role(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty name", async () => {
      const result = await use_cases.create(create_valid_input({ name: "" }));

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_role(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_role(),
      });

      const result = await use_cases.update("role-123", { name: "Updated" });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("role-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_roles_for_sport", () => {
    it("should return roles for sport", async () => {
      vi.mocked(mock_repository.find_by_sport).mockResolvedValue([
        create_test_role(),
      ]);

      const result = await use_cases.list_roles_for_sport("sport-123");

      expect(result.success).toBe(true);
    });
  });
});
