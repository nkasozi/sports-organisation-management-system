import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamStaffRepository } from "../interfaces/ports";
import { create_team_staff_use_cases } from "./TeamStaffUseCases";
import {
  create_mock_repository,
  create_mock_roles_repository,
  create_test_staff,
  create_valid_input,
} from "./TeamStaffUseCases.test_support";

describe("TeamStaffUseCases", () => {
  let mock_repository: TeamStaffRepository;
  let use_cases: ReturnType<typeof create_team_staff_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_staff_use_cases(
      mock_repository,
      create_mock_roles_repository(),
    );
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_staff(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty first_name", async () => {
      const result = await use_cases.create(
        create_valid_input({ first_name: "" }),
      );

      expect(result.success).toBe(false);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ team_id: "" }),
      );

      expect(result.success).toBe(false);
    });

    it("should fail for invalid profile image url", async () => {
      const result = await use_cases.create(
        create_valid_input({
          profile_image_url: "javascript:alert(1)",
        }),
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Profile image URL is invalid");
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_staff(),
      });

      const result = await use_cases.update("staff-123", {
        first_name: "Updated",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { first_name: "Updated" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("staff-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });
});
