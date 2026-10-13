import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_official_performance_rating_not_found_error,
  type OfficialPerformanceRatingRepository,
} from "../interfaces/ports";
import { create_failure_result } from "../types/Result";
import { create_official_performance_rating_use_cases } from "./OfficialPerformanceRatingUseCases";
import {
  create_mock_repository,
  create_test_rating,
  create_valid_input,
} from "./OfficialPerformanceRatingUseCases.test_support";

describe("OfficialPerformanceRatingUseCases", () => {
  let mock_repository: OfficialPerformanceRatingRepository;
  let use_cases: ReturnType<
    typeof create_official_performance_rating_use_cases
  >;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_official_performance_rating_use_cases(mock_repository);
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

      const result = await use_cases.list();

      expect(result.success).toBe(true);

      expect(mock_repository.find_all).toHaveBeenCalledWith(
        {},
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

      const result = await use_cases.list({ official_id: "off_1" });

      expect(result.success).toBe(true);

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

      const result = await use_cases.list_by_official("off_1");

      expect(result.success).toBe(true);

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

      const result = await use_cases.list_by_fixture("fix_1");

      expect(result.success).toBe(true);

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
      vi.mocked(mock_repository.find_existing_rating).mockResolvedValue(
        create_failure_result(
          build_official_performance_rating_not_found_error(
            "off_1",
            "fix_1",
            "user_1",
          ),
        ),
      );
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
