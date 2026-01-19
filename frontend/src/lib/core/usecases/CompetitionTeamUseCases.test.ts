import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_competition_team_use_cases } from "./CompetitionTeamUseCases";
import type { CompetitionTeamRepository } from "../interfaces/adapters/CompetitionTeamRepository";
import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
} from "../entities/CompetitionTeam";

function create_mock_repository(): CompetitionTeamRepository {
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
    find_by_competition: vi.fn(),
    find_by_team: vi.fn(),
    find_team_in_competition: vi.fn(),
    remove_team_from_competition: vi.fn(),
  };
}

function create_test_competition_team(
  overrides: Partial<CompetitionTeam> = {},
): CompetitionTeam {
  return {
    id: "comp-team-123",
    competition_id: "comp-123",
    team_id: "team-123",
    registration_date: "2024-01-01",
    seed_number: 1,
    group_name: "Group A",
    points: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    matches_played: 0,
    matches_won: 0,
    matches_drawn: 0,
    matches_lost: 0,
    notes: "",
    status: "registered",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateCompetitionTeamInput> = {},
): CreateCompetitionTeamInput {
  return {
    competition_id: "comp-123",
    team_id: "team-456",
    registration_date: "2024-01-01",
    seed_number: 2,
    group_name: "Group B",
    notes: "",
    status: "registered",
    ...overrides,
  };
}

describe("CompetitionTeamUseCases", () => {
  let mock_repository: CompetitionTeamRepository;
  let use_cases: ReturnType<typeof create_competition_team_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_competition_team_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all competition teams", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_competition_team()],
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
    it("should return competition team when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_competition_team(),
      });

      const result = await use_cases.get_by_id("comp-team-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.find_team_in_competition).mockResolvedValue({
        success: false,
        error: "Not found",
      });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_competition_team(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty competition_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ competition_id: "" }),
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
        data: create_test_competition_team(),
      });

      const result = await use_cases.update("comp-team-123", {
        group_name: "Group C",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { group_name: "Group C" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("comp-team-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_teams_by_competition", () => {
    it("should return teams for competition", async () => {
      vi.mocked(mock_repository.find_by_competition).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_competition_team()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_teams_in_competition("comp-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty competition_id", async () => {
      const result = await use_cases.list_teams_in_competition("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_competitions_by_team", () => {
    it("should return competitions for team", async () => {
      vi.mocked(mock_repository.find_by_team).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_competition_team()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_competitions_for_team("team-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.list_competitions_for_team("");

      expect(result.success).toBe(false);
    });
  });
});
