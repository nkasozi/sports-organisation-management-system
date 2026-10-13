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
  create_valid_user_input,
} from "./SystemUserUseCases.test_support";

describe("SystemUserUseCases", () => {
  let use_cases: SystemUserUseCases;
  let mock_repository: MockRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_system_user_use_cases(mock_repository);
  });

  describe("create", () => {
    it("should create a new system user successfully", async () => {
      const input = create_valid_user_input();
      const created_user = create_mock_user();
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([]),
      );
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(created_user),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.email).toBe("test@example.com");
      expect(result.data?.first_name).toBe("John");
      expect(result.data?.last_name).toBe("Doe");
      expect(result.data?.role).toBe("player");
    });

    it("should reject creation with missing email", async () => {
      const input = create_valid_user_input({ email: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Email is required");
    });

    it("should reject creation with invalid email format", async () => {
      const input = create_valid_user_input({ email: "invalid-email" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Invalid email format");
    });

    it("should reject creation with missing first name", async () => {
      const input = create_valid_user_input({ first_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("First name is required");
    });

    it("should reject creation with missing last name", async () => {
      const input = create_valid_user_input({ last_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Last name is required");
    });

    it("should reject duplicate email addresses", async () => {
      const input = create_valid_user_input();
      const existing_user = create_mock_user();
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([existing_user]),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("email already exists");
    });
  });

  describe("get_by_id", () => {
    it("should retrieve an existing user by id", async () => {
      const user = create_mock_user();
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(user),
      );

      const result = await use_cases.get_by_id("user_1");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.id).toBe("user_1");
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("User ID is required");
    });
  });
});
