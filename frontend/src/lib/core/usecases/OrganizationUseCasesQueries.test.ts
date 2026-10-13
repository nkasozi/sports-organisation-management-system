import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_organization_use_cases } from "./OrganizationUseCases";
import {
  create_mock_repository,
  create_test_organization,
} from "./OrganizationUseCases.test_support";

describe("OrganizationUseCases", () => {
  let mock_repository: OrganizationRepository;
  let use_cases: ReturnType<typeof create_organization_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_organization_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all organizations when no filter provided", async () => {
      const organizations = [
        create_test_organization({ id: "1" }),
        create_test_organization({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: organizations,
          total_count: 2,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total_count).toBe(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { name_contains: "Uganda" };
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_organization()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
      expect(result.success).toBe(true);
    });

    it("should return failure when repository fails", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });

  describe("get_by_id", () => {
    it("should return organization when found", async () => {
      const organization = create_test_organization();
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: organization,
      });

      const result = await use_cases.get_by_id("org-123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.name).toBe("Test Organization");
    });

    it("should return failure for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization ID is required");
    });

    it("should return failure for whitespace id", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization ID is required");
    });

    it("should return failure when not found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "Not found",
      });

      const result = await use_cases.get_by_id("nonexistent");

      expect(result.success).toBe(false);
    });
  });
});
