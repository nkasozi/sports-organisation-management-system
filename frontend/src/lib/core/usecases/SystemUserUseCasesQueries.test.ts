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
} from "./SystemUserUseCases.test_support";

describe("SystemUserUseCases", () => {
  let use_cases: SystemUserUseCases;
  let mock_repository: MockRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_system_user_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should list all users", async () => {
      const users = [
        create_mock_user({ id: "user_1" }),
        create_mock_user({ id: "user_2", email: "user2@example.com" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(users),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
    });

    it("should filter users by role", async () => {
      const admin_user = create_mock_user({ id: "user_1", role: "org_admin" });
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([admin_user]),
      );

      const result = await use_cases.list({ role: "org_admin" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].role).toBe("org_admin");
    });
  });
  describe("get_by_email", () => {
    it("should retrieve a user by email", async () => {
      const user = create_mock_user();
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([user]),
      );

      const result = await use_cases.get_by_email("test@example.com");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should be case-insensitive for email lookup", async () => {
      const user = create_mock_user();
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([user]),
      );

      const result = await use_cases.get_by_email("TEST@EXAMPLE.COM");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should fail for non-existent email", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([]),
      );

      const result = await use_cases.get_by_email("nonexistent@example.com");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("not found");
    });

    it("should fail with empty email", async () => {
      const result = await use_cases.get_by_email("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Email is required");
    });
  });
});
