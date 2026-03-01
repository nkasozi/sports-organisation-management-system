import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  create_system_user_use_cases,
  type SystemUserUseCases,
} from "./SystemUserUseCases";
import type {
  Repository,
  QueryOptions,
} from "../interfaces/adapters/Repository";
import type {
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
} from "../entities/SystemUser";
import type { Result, PaginatedResult } from "../types/Result";

type MockRepository = Repository<
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput
>;

function create_mock_repository(): MockRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_mock_user(overrides: Partial<SystemUser> = {}): SystemUser {
  return {
    id: "user_1",
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "player",
    organization_id: "org_1",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_user_input(
  overrides: Partial<CreateSystemUserInput> = {},
): CreateSystemUserInput {
  return {
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "player",
    organization_id: "org_1",
    ...overrides,
  };
}

function create_success_result<T>(data: T): Result<T, string> {
  return { success: true, data };
}

function create_paginated_result<T>(
  items: T[],
  total_count?: number,
): Result<PaginatedResult<T>, string> {
  return {
    success: true,
    data: {
      items,
      total_count: total_count ?? items.length,
      page_number: 1,
      page_size: 10,
      total_pages: 1,
    },
  };
}

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
      expect(result.data?.email).toBe("test@example.com");
      expect(result.data?.first_name).toBe("John");
      expect(result.data?.last_name).toBe("Doe");
      expect(result.data?.role).toBe("player");
    });

    it("should reject creation with missing email", async () => {
      const input = create_valid_user_input({ email: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Email is required");
    });

    it("should reject creation with invalid email format", async () => {
      const input = create_valid_user_input({ email: "invalid-email" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Invalid email format");
    });

    it("should reject creation with missing first name", async () => {
      const input = create_valid_user_input({ first_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("First name is required");
    });

    it("should reject creation with missing last name", async () => {
      const input = create_valid_user_input({ last_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Last name is required");
    });

    it("should reject duplicate email addresses", async () => {
      const input = create_valid_user_input();
      const existing_user = create_mock_user();
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([existing_user]),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("email already exists");
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
      expect(result.data?.id).toBe("user_1");
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("User ID is required");
    });
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
      expect(result.data.length).toBe(2);
    });

    it("should filter users by role", async () => {
      const admin_user = create_mock_user({ id: "user_1", role: "org_admin" });
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([admin_user]),
      );

      const result = await use_cases.list({ role: "org_admin" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].role).toBe("org_admin");
    });
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
      expect(result.error_message).toContain("email already exists");
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.update("", { first_name: "Jane" });

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("User ID is required");
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
      expect(result.error_message).toContain("User ID is required");
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
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should be case-insensitive for email lookup", async () => {
      const user = create_mock_user();
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([user]),
      );

      const result = await use_cases.get_by_email("TEST@EXAMPLE.COM");

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should fail for non-existent email", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([]),
      );

      const result = await use_cases.get_by_email("nonexistent@example.com");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("not found");
    });

    it("should fail with empty email", async () => {
      const result = await use_cases.get_by_email("");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Email is required");
    });
  });
});
