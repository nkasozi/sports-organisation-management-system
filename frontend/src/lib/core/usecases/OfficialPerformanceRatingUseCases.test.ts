import { beforeEach, describe, expect, it, vi } from "vitest";

import { type OfficialPerformanceRatingRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
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

  describe("failure logging", () => {
    it("returns a user-safe message and logs the repository error", async () => {
      const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: false,
        error: "IndexedDB transaction aborted",
      });
      const result = await use_cases.delete("opr_001");
      expect(result).toEqual({
        success: false,
        error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      });
      expect(error_spy).toHaveBeenCalledWith(
        "[OfficialPerformanceRatingUseCases]",
        {
          event: "official_rating_delete_failed",
          error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
          technical_detail: "IndexedDB transaction aborted",
          rating_id: "opr_001",
        },
      );
      error_spy.mockRestore();
    });

    it("keeps the specific message when the update target is missing", async () => {
      const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "not found",
      });
      const result = await use_cases.update("opr_missing", { overall: 9 });
      expect(result).toEqual({ success: false, error: "Rating not found" });
      error_spy.mockRestore();
    });

    it("uses the current user as rater when one is available", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_rating(),
      });
      const rating_use_cases = create_official_performance_rating_use_cases(
        mock_repository,
        () => ({ status: "available", id: "user_9", role: "team_manager" }),
      );
      const result = await rating_use_cases.create(create_valid_input());
      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rater_user_id: "user_9",
          rater_role: "team_manager",
        }),
      );
    });
  });
});
