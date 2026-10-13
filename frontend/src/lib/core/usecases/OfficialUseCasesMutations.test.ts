import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OfficialRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_official_use_cases } from "./OfficialUseCases";
import {
  create_mock_repository,
  create_test_official,
} from "./OfficialUseCases.test_support";

describe("OfficialUseCases", () => {
  let mock_repository: OfficialRepository;
  let use_cases: ReturnType<typeof create_official_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_official_use_cases(mock_repository);
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_official({ first_name: "Updated" }),
      });

      const result = await use_cases.update("official-123", {
        first_name: "Updated",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { first_name: "Updated" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Official ID is required");
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("official-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("delete_officials", () => {
    it("should delete multiple", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await use_cases.delete_officials(["1", "2"]);

      expect(result.success).toBe(true);
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_officials([]);

      expect(result.success).toBe(false);
    });
  });

  describe("failure logging", () => {
    it("returns a user-safe message and logs the repository error", async () => {
      const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(mock_repository.find_by_organization).mockResolvedValue({
        success: false,
        error: "IndexedDB transaction aborted",
      });
      const result = await use_cases.list_officials_by_organization("org-1");
      expect(result).toEqual({
        success: false,
        error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      });
      expect(error_spy).toHaveBeenCalledWith("[OfficialUseCases]", {
        event: "official_list_by_organization_failed",
        error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
        technical_detail: "IndexedDB transaction aborted",
        organization_id: "org-1",
      });
      error_spy.mockRestore();
    });

    it("keeps the specific message when the date is missing", async () => {
      const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await use_cases.list_available_officials("");
      expect(result).toEqual({ success: false, error: "Date is required" });
      expect(mock_repository.find_available_for_date).not.toHaveBeenCalled();
      error_spy.mockRestore();
    });
  });
});
