import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_official_performance_rating_use_cases } from "./OfficialPerformanceRatingUseCases";
import type { OfficialPerformanceRatingRepository } from "../interfaces/ports";
import type {
  OfficialPerformanceRating,
  CreateOfficialPerformanceRatingInput,
} from "../entities/OfficialPerformanceRating";

function create_mock_repository(): OfficialPerformanceRatingRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_official: vi.fn(),
    find_by_fixture: vi.fn(),
    find_by_official_and_fixture: vi.fn(),
    find_existing_rating: vi.fn(),
  };
}

function create_test_rating(
  overrides: Partial<OfficialPerformanceRating> = {},
): OfficialPerformanceRating {
  return {
    id: "opr_001",
    organization_id: "org_1",
    official_id: "off_1",
    fixture_id: "fix_1",
    rater_user_id: "user_1",
    rater_role: "officials_manager",
    overall: 7,
    decision_accuracy: 7,
    game_control: 7,
    communication: 7,
    fitness: 7,
    notes: "",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateOfficialPerformanceRatingInput> = {},
): CreateOfficialPerformanceRatingInput {
  return {
    organization_id: "org_1",
    official_id: "off_1",
    fixture_id: "fix_1",
    rater_user_id: "user_1",
    rater_role: "officials_manager",
    overall: 7,
    decision_accuracy: 7,
    game_control: 7,
    communication: 7,
    fitness: 7,
    notes: "",
    ...overrides,
  };
}

describe("OfficialPerformanceRatingUseCases", () => {
  let mock_repository: OfficialPerformanceRatingRepository;
  let use_cases: ReturnType<
    typeof create_official_performance_rating_use_cases
  >;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_official_performance_rating_use_cases(mock_repository);
  });

  describe("create", () => {
    it("creates a rating with valid input", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_rating(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledOnce();
    });

    it("fails without reaching repository when official_id is empty", async () => {
      const result = await use_cases.create(
        create_valid_input({ official_id: "" }),
      );

      expect(result.success).toBe(false);
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("fails without reaching repository when fixture_id is empty", async () => {
      const result = await use_cases.create(
        create_valid_input({ fixture_id: "" }),
      );

      expect(result.success).toBe(false);
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("fails without reaching repository when a dimension is out of range", async () => {
      const result = await use_cases.create(
        create_valid_input({ overall: 11 }),
      );

      expect(result.success).toBe(false);
      expect(mock_repository.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates when existing rating is found and merged input is valid", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_rating(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_rating({ overall: 9 }),
      });

      const result = await use_cases.update("opr_001", { overall: 9 });

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith("opr_001", {
        overall: 9,
      });
    });

    it("fails when rating is not found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "not found",
      });

      const result = await use_cases.update("opr_missing", { overall: 9 });

      expect(result.success).toBe(false);
      expect(mock_repository.update).not.toHaveBeenCalled();
    });
  });

  describe("get_by_id", () => {
    it("returns rating when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_rating(),
      });

      const result = await use_cases.get_by_id("opr_001");

      expect(result.success).toBe(true);
    });

    it("delegates repository error back to caller", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "not found",
      });

      const result = await use_cases.get_by_id("opr_missing");

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("opr_001");

      expect(result.success).toBe(true);
    });
  });

  describe("list", () => {
    it("calls find_all with no filter when no filter given", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 100,
          total_pages: 0,
        },
      });

      await use_cases.list();

      expect(mock_repository.find_all).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ page_number: 1 }),
      );
    });

    it("passes typed filter to find_all when filter given", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 100,
          total_pages: 0,
        },
      });

      await use_cases.list({ official_id: "off_1" });

      const call_arg = vi.mocked(mock_repository.find_all).mock.calls[0][0];
      expect(call_arg).toMatchObject({ official_id: "off_1" });
    });
  });

  describe("list_by_official", () => {
    it("delegates to find_by_official", async () => {
      vi.mocked(mock_repository.find_by_official).mockResolvedValue({
        success: true,
        data: {
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 200,
          total_pages: 0,
        },
      });

      await use_cases.list_by_official("off_1");

      expect(mock_repository.find_by_official).toHaveBeenCalledWith(
        "off_1",
        expect.objectContaining({ page_number: 1 }),
      );
    });
  });

  describe("list_by_fixture", () => {
    it("delegates to find_by_fixture", async () => {
      vi.mocked(mock_repository.find_by_fixture).mockResolvedValue({
        success: true,
        data: {
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 200,
          total_pages: 0,
        },
      });

      await use_cases.list_by_fixture("fix_1");

      expect(mock_repository.find_by_fixture).toHaveBeenCalledWith(
        "fix_1",
        expect.objectContaining({ page_number: 1 }),
      );
    });
  });

  describe("submit_or_update_rating", () => {
    it("fails validation before touching repository", async () => {
      const result = await use_cases.submit_or_update_rating(
        create_valid_input({ official_id: "" }),
      );

      expect(result.success).toBe(false);
      expect(mock_repository.find_existing_rating).not.toHaveBeenCalled();
    });

    it("creates new rating when no existing one is found", async () => {
      vi.mocked(mock_repository.find_existing_rating).mockResolvedValue({
        success: true,
        data: null,
      });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_rating(),
      });

      const result =
        await use_cases.submit_or_update_rating(create_valid_input());

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledOnce();
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("updates existing rating when one already exists", async () => {
      const existing = create_test_rating();
      vi.mocked(mock_repository.find_existing_rating).mockResolvedValue({
        success: true,
        data: existing,
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_rating({ overall: 9 }),
      });

      const result = await use_cases.submit_or_update_rating(
        create_valid_input({ overall: 9 }),
      );

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({ overall: 9 }),
      );
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("returns failure when lookup fails", async () => {
      vi.mocked(mock_repository.find_existing_rating).mockResolvedValue({
        success: false,
        error: "database error",
      });

      const result =
        await use_cases.submit_or_update_rating(create_valid_input());

      expect(result.success).toBe(false);
      expect(mock_repository.create).not.toHaveBeenCalled();
    });
  });
});
