import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_sport_use_cases } from "./SportUseCases";
import type { SportRepository } from "../interfaces/adapters/SportRepository";
import type { Sport, CreateSportInput } from "../entities/Sport";

function create_mock_repository(): SportRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_sport(overrides: Partial<Sport> = {}): Sport {
  return {
    id: "sport-123",
    name: "Football",
    code: "FB",
    description: "Association football",
    icon_url: "",
    standard_game_duration_minutes: 90,
    periods: [],
    card_types: [],
    foul_categories: [],
    official_requirements: [],
    overtime_rules: {
      is_enabled: false,
      trigger_condition: "never",
      overtime_type: "extra_time",
      extra_time_periods: [],
      penalties_config: null,
    },
    scoring_rules: [],
    substitution_rules: {
      max_substitutions_per_game: 3,
      max_substitution_windows: null,
      rolling_substitutions_allowed: false,
      return_after_substitution_allowed: false,
    },
    max_players_on_field: 11,
    min_players_on_field: 7,
    max_squad_size: 18,
    min_players_per_fixture: 7,
    max_players_per_fixture: 18,
    additional_rules: {},
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateSportInput> = {},
): CreateSportInput {
  return {
    name: "Basketball",
    code: "BB",
    description: "Team sport",
    icon_url: "",
    standard_game_duration_minutes: 48,
    periods: [],
    card_types: [],
    foul_categories: [],
    official_requirements: [],
    overtime_rules: {
      is_enabled: false,
      trigger_condition: "never",
      overtime_type: "extra_time",
      extra_time_periods: [],
      penalties_config: null,
    },
    scoring_rules: [],
    substitution_rules: {
      max_substitutions_per_game: 12,
      max_substitution_windows: null,
      rolling_substitutions_allowed: true,
      return_after_substitution_allowed: true,
    },
    max_players_on_field: 5,
    min_players_on_field: 5,
    max_squad_size: 12,
    min_players_per_fixture: 5,
    max_players_per_fixture: 12,
    additional_rules: {},
    status: "active",
    ...overrides,
  };
}

describe("SportUseCases", () => {
  let mock_repository: SportRepository;
  let use_cases: ReturnType<typeof create_sport_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_sport_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all sports when no filter", async () => {
      const sports = [
        create_test_sport({ id: "1" }),
        create_test_sport({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: sports,
          total_count: 2,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { status: "active" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_sport()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        filter,
        undefined,
      );
    });
  });

  describe("get_by_id", () => {
    it("should return sport when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_sport(),
      });

      const result = await use_cases.get_by_id("sport-123");

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Football");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Sport ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_sport({ name: input.name }),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for empty name", async () => {
      const input = create_valid_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_sport({ name: "Updated Sport" }),
      });

      const result = await use_cases.update("sport-123", {
        name: "Updated Sport",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Sport ID is required");
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("sport-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("delete_sports", () => {
    it("should delete multiple", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await use_cases.delete_sports(["1", "2"]);

      expect(result.success).toBe(true);
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_sports([]);

      expect(result.success).toBe(false);
    });
  });
});
