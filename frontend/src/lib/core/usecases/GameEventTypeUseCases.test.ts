import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_game_event_type_use_cases } from "./GameEventTypeUseCases";
import type { GameEventTypeRepository } from "../interfaces/adapters/GameEventTypeRepository";
import type {
  GameEventType,
  CreateGameEventTypeInput,
} from "../entities/GameEventType";

function create_mock_repository(): GameEventTypeRepository {
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
    find_by_category: vi.fn(),
    find_by_code: vi.fn(),
    find_scoring_events: vi.fn(),
  };
}

function create_test_event_type(
  overrides: Partial<GameEventType> = {},
): GameEventType {
  return {
    id: "event-type-123",
    name: "Goal",
    code: "GOAL",
    description: "A goal scored",
    icon: "⚽",
    color: "bg-green-500",
    category: "score",
    affects_score: true,
    requires_player: true,
    display_order: 1,
    sport_id: "sport-123",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateGameEventTypeInput> = {},
): CreateGameEventTypeInput {
  return {
    name: "Yellow Card",
    code: "YELLOW",
    description: "Caution",
    icon: "🟨",
    color: "bg-yellow-500",
    category: "discipline",
    affects_score: false,
    requires_player: true,
    display_order: 2,
    sport_id: "sport-123",
    status: "active",
    ...overrides,
  };
}

describe("GameEventTypeUseCases", () => {
  let mock_repository: GameEventTypeRepository;
  let use_cases: ReturnType<typeof create_game_event_type_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_event_type_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all event types when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_event_type()],
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
    it("should return event type when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_event_type(),
      });

      const result = await use_cases.get_by_id("event-type-123");

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
        data: create_test_event_type(),
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
        data: create_test_event_type(),
      });
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(null);
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_event_type(),
      });

      const result = await use_cases.update("event-type-123", {
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

      const result = await use_cases.delete("event-type-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_event_types_for_sport", () => {
    it("should return event types for sport", async () => {
      vi.mocked(mock_repository.find_by_sport).mockResolvedValue([
        create_test_event_type(),
      ]);

      const result = await use_cases.list_event_types_for_sport("sport-123");

      expect(result.success).toBe(true);
    });
  });
});
