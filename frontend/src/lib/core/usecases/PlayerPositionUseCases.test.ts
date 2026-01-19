import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_player_position_use_cases } from "./PlayerPositionUseCases";
import type { PlayerPositionRepository } from "../interfaces/adapters/PlayerPositionRepository";
import type {
  PlayerPosition,
  CreatePlayerPositionInput,
} from "../entities/PlayerPosition";

function create_mock_repository(): PlayerPositionRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_code: vi.fn(),
    find_by_sport_type: vi.fn(),
    find_by_category: vi.fn(),
    find_available_positions: vi.fn(),
  };
}

function create_test_position(
  overrides: Partial<PlayerPosition> = {},
): PlayerPosition {
  return {
    id: "position-123",
    name: "Goalkeeper",
    code: "GK",
    category: "goalkeeper",
    description: "Defends the goal",
    sport_type: "Football",
    display_order: 1,
    is_available: true,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreatePlayerPositionInput> = {},
): CreatePlayerPositionInput {
  return {
    name: "Striker",
    code: "ST",
    category: "forward",
    description: "Scores goals",
    sport_type: "Football",
    display_order: 10,
    is_available: true,
    status: "active",
    ...overrides,
  };
}

describe("PlayerPositionUseCases", () => {
  let mock_repository: PlayerPositionRepository;
  let use_cases: ReturnType<typeof create_player_position_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_position_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all positions when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_position()],
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
    it("should return position when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_position(),
      });

      const result = await use_cases.get_by_id("position-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(null);
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_position(),
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
        data: create_test_position(),
      });
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(null);
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_position(),
      });

      const result = await use_cases.update("position-123", {
        name: "Updated",
      });

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

      const result = await use_cases.delete("position-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_positions_by_sport", () => {
    it("should return positions for sport", async () => {
      vi.mocked(mock_repository.find_by_sport_type).mockResolvedValue([
        create_test_position(),
      ]);

      const result = await use_cases.list_positions_by_sport("Football");

      expect(result.success).toBe(true);
    });

    it("should fail for empty sport_id", async () => {
      const result = await use_cases.list_positions_by_sport("");

      expect(result.success).toBe(false);
    });
  });
});
