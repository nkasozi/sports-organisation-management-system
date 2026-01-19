import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_competition_format_use_cases } from "./CompetitionFormatUseCases";
import type { CompetitionFormatRepository } from "../interfaces/adapters/CompetitionFormatRepository";
import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
} from "../entities/CompetitionFormat";

function create_mock_repository(): CompetitionFormatRepository {
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
    find_by_format_type: vi.fn(),
    find_by_code: vi.fn(),
    find_active_formats: vi.fn(),
  };
}

function create_test_format(
  overrides: Partial<CompetitionFormat> = {},
): CompetitionFormat {
  return {
    id: "format-123",
    name: "Round Robin",
    code: "RR",
    description: "Each team plays every other team",
    format_type: "round_robin",
    tie_breakers: ["goal_difference"],
    group_stage_config: null,
    knockout_stage_config: null,
    league_config: {
      number_of_rounds: 1,
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
      promotion_spots: 0,
      relegation_spots: 0,
      playoff_spots: 0,
    },
    min_teams_required: 2,
    max_teams_allowed: 20,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateCompetitionFormatInput> = {},
): CreateCompetitionFormatInput {
  return {
    name: "Knockout",
    code: "KO",
    description: "Single elimination tournament",
    format_type: "straight_knockout",
    tie_breakers: ["goal_difference"],
    group_stage_config: null,
    knockout_stage_config: {
      number_of_rounds: 4,
      third_place_match: false,
      two_legged_ties: false,
      away_goals_rule: false,
      extra_time_enabled: true,
      penalty_shootout_enabled: true,
    },
    league_config: null,
    min_teams_required: 4,
    max_teams_allowed: 64,
    status: "active",
    ...overrides,
  };
}

describe("CompetitionFormatUseCases", () => {
  let mock_repository: CompetitionFormatRepository;
  let use_cases: ReturnType<typeof create_competition_format_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_competition_format_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all formats when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_format()],
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
    it("should return format when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });

      const result = await use_cases.get_by_id("format-123");

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
        data: create_test_format(),
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
        data: create_test_format(),
      });
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(null);
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });

      const result = await use_cases.update("format-123", { name: "Updated" });

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

      const result = await use_cases.delete("format-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });
});
