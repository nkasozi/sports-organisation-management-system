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
  create_valid_input,
} from "./OrganizationUseCases.test_support";

describe("OrganizationUseCases", () => {
  let mock_repository: OrganizationRepository;
  let use_cases: ReturnType<typeof create_organization_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_organization_use_cases(mock_repository);
  });

  describe("create", () => {
    it("should create organization with valid input", async () => {
      const input = create_valid_input();
      const created = create_test_organization({ name: input.name });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.name).toBe("New Organization");
    });

    it("should fail validation for empty name", async () => {
      const input = create_valid_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("name");
    });

    it("should fail validation for short name", async () => {
      const input = create_valid_input({ name: "A" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail validation for invalid website url", async () => {
      const input = create_valid_input({ website: "javascript:alert(1)" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Website URL is invalid");
    });

    it("should return failure when repository fails", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });

  describe("update", () => {
    it("should update organization with valid input", async () => {
      const updated = create_test_organization({ name: "Updated Name" });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated,
      });

      const result = await use_cases.update("org-123", {
        name: "Updated Name",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.name).toBe("Updated Name");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization ID is required");
    });

    it("should return failure when repository fails", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: false,
        error: "Update failed",
      });

      const result = await use_cases.update("org-123", { name: "Updated" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete organization by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("org-123");

      expect(result.success).toBe(true);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("org-123");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization ID is required");
    });
  });

  describe("delete_organizations", () => {
    it("should delete multiple organizations", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 3,
      });

      const result = await use_cases.delete_organizations(["1", "2", "3"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_organizations([]);

      expect(result.success).toBe(false);
    });
  });
});
