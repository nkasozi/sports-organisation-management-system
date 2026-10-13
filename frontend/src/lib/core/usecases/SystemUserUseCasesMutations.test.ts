import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_system_user_use_cases,
  type SystemUserUseCases,
} from "./SystemUserUseCases";
import type { MockRepository } from "./SystemUserUseCases.test_support";
import {
  create_mock_repository,
  create_mock_user,
  create_paginated_result,
  create_success_result,
} from "./SystemUserUseCases.test_support";

describe("SystemUserUseCases", () => {
  let use_cases: SystemUserUseCases;
  let mock_repository: MockRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_system_user_use_cases(mock_repository);
  });

  describe("update", () => {
    it("should update an existing user", async () => {
      const existing_user = create_mock_user();
      const updated_user = create_mock_user({
        first_name: "Jane",
        role: "org_admin",
      });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(existing_user),
      );
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([existing_user]),
      );
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_success_result(updated_user),
      );

      const result = await use_cases.update("user_1", {
        first_name: "Jane",
        role: "org_admin",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.first_name).toBe("Jane");
      expect(result.data?.role).toBe("org_admin");
    });

    it("should reject update with duplicate email", async () => {
      const existing_user = create_mock_user({ id: "user_1" });
      const other_user = create_mock_user({
        id: "user_2",
        email: "other@example.com",
      });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(other_user),
      );
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([existing_user, other_user]),
      );

      const result = await use_cases.update("user_2", {
        email: "test@example.com",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("email already exists");
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.update("", { first_name: "Jane" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("User ID is required");
    });
  });

  describe("delete", () => {
    it("should delete an existing user", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_success_result(true),
      );

      const result = await use_cases.delete("user_1");

      expect(result.success).toBe(true);
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("User ID is required");
    });
  });
});
