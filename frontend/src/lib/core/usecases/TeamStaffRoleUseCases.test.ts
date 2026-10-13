import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamStaffRoleRepository } from "../interfaces/ports";
import { create_team_staff_role_use_cases } from "./TeamStaffRoleUseCases";
import {
  create_mock_repository,
  create_test_role,
  create_valid_input,
} from "./TeamStaffRoleUseCases.test_support";

describe("TeamStaffRoleUseCases", () => {
  let mock_repository: TeamStaffRoleRepository;
  let use_cases: ReturnType<typeof create_team_staff_role_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_staff_role_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all roles", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_role()],
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
    it("should return role when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_role(),
      });

      const result = await use_cases.get_by_id("role-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_role(),
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
        data: create_test_role(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_role(),
      });

      const result = await use_cases.update("role-123", {
        name: "Senior Coach",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Senior Coach" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("role-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_roles_by_category", () => {
    it("should return roles for category", async () => {
      vi.mocked(mock_repository.find_by_category).mockResolvedValue({
        success: true,
        data: [create_test_role()],
      });

      const result = await use_cases.list_roles_by_category("coaching");

      expect(result.success).toBe(true);
    });
  });
});
