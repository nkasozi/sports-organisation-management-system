import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_competition_use_cases } from "./CompetitionUseCases";
import type { CompetitionRepository } from "../interfaces/adapters/CompetitionRepository";
import type {
  Competition,
  CreateCompetitionInput,
} from "../entities/Competition";

function create_mock_repository(): CompetitionRepository {
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
    find_by_organization: vi.fn(),
    find_active_competitions: vi.fn(),
  };
}

function create_test_competition(
  overrides: Partial<Competition> = {},
): Competition {
  return {
    id: "comp-123",
    name: "Test League",
    description: "Test Description",
    organization_id: "org-123",
    competition_format_id: "format-123",
    team_ids: [],
    allow_auto_squad_submission: false,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    registration_deadline: "2023-12-31",
    max_teams: 16,
    entry_fee: 0,
    prize_pool: 0,
    location: "Test Location",
    rule_overrides: {},
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateCompetitionInput> = {},
): CreateCompetitionInput {
  return {
    name: "New Competition",
    description: "New Description",
    organization_id: "org-123",
    competition_format_id: "format-123",
    team_ids: [],
    allow_auto_squad_submission: false,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    registration_deadline: "2023-12-31",
    max_teams: 16,
    entry_fee: 0,
    prize_pool: 0,
    location: "Test Location",
    rule_overrides: {},
    status: "active",
    ...overrides,
  };
}

describe("CompetitionUseCases", () => {
  let mock_repository: CompetitionRepository;
  let use_cases: ReturnType<typeof create_competition_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_competition_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all competitions when no filter", async () => {
      const competitions = [
        create_test_competition({ id: "1" }),
        create_test_competition({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: competitions,
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
      const filter = { organization_id: "org-123" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_competition()],
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
      expect(result.success).toBe(true);
    });

    it("should return failure when repository fails", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(false);
    });
  });

  describe("get_by_id", () => {
    it("should return competition when found", async () => {
      const competition = create_test_competition();
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: competition,
      });

      const result = await use_cases.get_by_id("comp-123");

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Test League");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Competition ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      const created = create_test_competition({ name: input.name });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for empty name", async () => {
      const input = create_valid_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for missing organization_id", async () => {
      const input = create_valid_input({ organization_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_competition({ name: "Updated" }),
      });

      const result = await use_cases.update("comp-123", { name: "Updated" });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Competition ID is required");
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("comp-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("delete_competitions", () => {
    it("should delete multiple", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await use_cases.delete_competitions(["1", "2"]);

      expect(result.success).toBe(true);
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_competitions([]);

      expect(result.success).toBe(false);
    });
  });

  describe("list_competitions_by_organization", () => {
    it("should return competitions for organization", async () => {
      vi.mocked(mock_repository.find_by_organization).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_competition()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result =
        await use_cases.list_competitions_by_organization("org-123");

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_organization).toHaveBeenCalledWith(
        "org-123",
        undefined,
      );
    });

    it("should fail for empty organization_id", async () => {
      const result = await use_cases.list_competitions_by_organization("");

      expect(result.success).toBe(false);
    });
  });
});
