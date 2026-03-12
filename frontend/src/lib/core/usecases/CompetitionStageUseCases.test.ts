import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_competition_stage_use_cases } from "./CompetitionStageUseCases";
import type { CompetitionStageRepository } from "../interfaces/ports";
import type { FixtureRepository } from "../interfaces/ports";
import type {
  CompetitionStage,
  CreateCompetitionStageInput,
} from "../entities/CompetitionStage";

function create_mock_stage_repository(): CompetitionStageRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
  };
}

function create_mock_fixture_repository(): FixtureRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    create_many: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
    find_by_team: vi.fn(),
    find_by_round: vi.fn(),
    find_upcoming: vi.fn(),
    find_by_date_range: vi.fn(),
  };
}

function create_test_stage(
  overrides: Partial<CompetitionStage> = {},
): CompetitionStage {
  return {
    id: "stage-123",
    competition_id: "comp-123",
    name: "Pool Stage",
    stage_type: "group_stage",
    stage_order: 1,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateCompetitionStageInput> = {},
): CreateCompetitionStageInput {
  return {
    competition_id: "comp-123",
    name: "Pool Stage",
    stage_type: "group_stage",
    stage_order: 1,
    status: "active",
    ...overrides,
  };
}

describe("CompetitionStageUseCases", () => {
  let mock_repository: CompetitionStageRepository;
  let mock_fixture_repository: FixtureRepository;
  let use_cases: ReturnType<typeof create_competition_stage_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_stage_repository();
    mock_fixture_repository = create_mock_fixture_repository();
    use_cases = create_competition_stage_use_cases(
      mock_repository,
      mock_fixture_repository,
    );
  });

  describe("create", () => {
    it("returns failure when name is empty", async () => {
      const input = create_valid_input({ name: "" });
      const result = await use_cases.create(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Stage name is required");
      }
    });

    it("returns failure when stage_order is less than 1", async () => {
      const input = create_valid_input({ stage_order: 0 });
      const result = await use_cases.create(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Stage order must be at least 1");
      }
    });

    it("creates stage when input is valid", async () => {
      const input = create_valid_input();
      const expected_stage = create_test_stage();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: expected_stage,
      });
      const result = await use_cases.create(input);
      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });
  });

  describe("list_stages_by_competition", () => {
    it("returns stages sorted ascending by stage_order", async () => {
      const stages = [
        create_test_stage({ id: "s3", stage_order: 3, name: "Final" }),
        create_test_stage({ id: "s1", stage_order: 1, name: "Pool Stage" }),
        create_test_stage({
          id: "s2",
          stage_order: 2,
          name: "Semi Finals",
        }),
      ];
      vi.mocked(mock_repository.find_by_competition).mockResolvedValue({
        success: true,
        data: {
          items: stages,
          total_count: 3,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        },
      });
      const result = await use_cases.list_stages_by_competition("comp-123");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].name).toBe("Pool Stage");
        expect(result.data.items[1].name).toBe("Semi Finals");
        expect(result.data.items[2].name).toBe("Final");
      }
    });

    it("returns failure when competition_id is empty", async () => {
      const result = await use_cases.list_stages_by_competition("");
      expect(result.success).toBe(false);
    });
  });

  describe("reorder_stages", () => {
    it("updates stage_order for each id in provided order", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_stage(),
      });
      const result = await use_cases.reorder_stages("comp-123", [
        "stage-a",
        "stage-b",
        "stage-c",
      ]);
      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith("stage-a", {
        stage_order: 1,
      });
      expect(mock_repository.update).toHaveBeenCalledWith("stage-b", {
        stage_order: 2,
      });
      expect(mock_repository.update).toHaveBeenCalledWith("stage-c", {
        stage_order: 3,
      });
    });

    it("returns failure if any update fails", async () => {
      vi.mocked(mock_repository.update)
        .mockResolvedValueOnce({ success: true, data: create_test_stage() })
        .mockResolvedValueOnce({ success: false, error: "Not found" });
      const result = await use_cases.reorder_stages("comp-123", [
        "stage-a",
        "stage-b",
      ]);
      expect(result.success).toBe(false);
    });

    it("returns failure when ordered_stage_ids is empty", async () => {
      const result = await use_cases.reorder_stages("comp-123", []);
      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("returns failure when stage has linked fixtures", async () => {
      vi.mocked(mock_fixture_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: "fix-1",
              stage_id: "stage-123",
              competition_id: "comp-123",
              organization_id: "org-1",
              round_number: 1,
              round_name: "Round 1",
              home_team_id: "team-1",
              away_team_id: "team-2",
              venue: "Stadium",
              scheduled_date: "2026-04-01",
              scheduled_time: "15:00",
              home_team_score: null,
              away_team_score: null,
              assigned_officials: [],
              game_events: [],
              current_period: "pre_game",
              current_minute: 0,
              match_day: 1,
              notes: "",
              status: "scheduled",
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
          total_count: 1,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        },
      });
      const result = await use_cases.delete("stage-123");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("linked fixtures");
      }
      expect(mock_repository.delete_by_id).not.toHaveBeenCalled();
    });

    it("deletes stage when no linked fixtures", async () => {
      vi.mocked(mock_fixture_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        },
      });
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });
      const result = await use_cases.delete("stage-123");
      expect(result.success).toBe(true);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("stage-123");
    });
  });
});
