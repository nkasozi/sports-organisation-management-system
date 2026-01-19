import { describe, it, expect, beforeEach } from "vitest";
import {
  create_system_user_use_cases,
  type SystemUserUseCases,
} from "./SystemUserUseCases";
import { InMemorySystemUserRepository } from "../../adapters/repositories/InMemorySystemUserRepository";
import type { CreateSystemUserInput } from "../entities/SystemUser";

describe("SystemUserUseCases", () => {
  let use_cases: SystemUserUseCases;
  let repository: InMemorySystemUserRepository;

  beforeEach(() => {
    repository = new InMemorySystemUserRepository();
    use_cases = create_system_user_use_cases(repository);
  });

  function create_valid_user_input(): CreateSystemUserInput {
    return {
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "user",
    };
  }

  describe("create", () => {
    it("should create a new system user successfully", async () => {
      const input = create_valid_user_input();

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe("test@example.com");
      expect(result.data?.first_name).toBe("John");
      expect(result.data?.last_name).toBe("Doe");
      expect(result.data?.role).toBe("user");
    });

    it("should reject creation with missing email", async () => {
      const input = create_valid_user_input();
      input.email = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Email is required");
    });

    it("should reject creation with invalid email format", async () => {
      const input = create_valid_user_input();
      input.email = "invalid-email";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Invalid email format");
    });

    it("should reject creation with missing first name", async () => {
      const input = create_valid_user_input();
      input.first_name = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("First name is required");
    });

    it("should reject creation with missing last name", async () => {
      const input = create_valid_user_input();
      input.last_name = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Last name is required");
    });

    it("should reject duplicate email addresses", async () => {
      const input = create_valid_user_input();
      await use_cases.create(input);

      const duplicate_input = {
        ...create_valid_user_input(),
        first_name: "Jane",
      };

      const result = await use_cases.create(duplicate_input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("email already exists");
    });
  });

  describe("get_by_id", () => {
    it("should retrieve an existing user by id", async () => {
      const input = create_valid_user_input();
      const created = await use_cases.create(input);
      const user_id = created.data!.id;

      const result = await use_cases.get_by_id(user_id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(user_id);
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
      await use_cases.create(create_valid_user_input());
      await use_cases.create({
        ...create_valid_user_input(),
        email: "user2@example.com",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it("should filter users by role", async () => {
      await use_cases.create({
        ...create_valid_user_input(),
        role: "admin",
      });
      await use_cases.create({
        ...create_valid_user_input(),
        email: "user2@example.com",
        role: "user",
      });

      const result = await use_cases.list({ role: "admin" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].role).toBe("admin");
    });
  });

  describe("update", () => {
    it("should update an existing user", async () => {
      const created = await use_cases.create(create_valid_user_input());
      const user_id = created.data!.id;

      const result = await use_cases.update(user_id, {
        first_name: "Jane",
        role: "admin",
      });

      expect(result.success).toBe(true);
      expect(result.data?.first_name).toBe("Jane");
      expect(result.data?.role).toBe("admin");
    });

    it("should reject update with duplicate email", async () => {
      await use_cases.create(create_valid_user_input());
      const second_user = await use_cases.create({
        ...create_valid_user_input(),
        email: "user2@example.com",
      });

      const result = await use_cases.update(second_user.data!.id, {
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
      const created = await use_cases.create(create_valid_user_input());
      const user_id = created.data!.id;

      const result = await use_cases.delete(user_id);

      expect(result.success).toBe(true);

      const get_result = await use_cases.get_by_id(user_id);
      expect(get_result.success).toBe(false);
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("User ID is required");
    });
  });

  describe("get_by_email", () => {
    it("should retrieve a user by email", async () => {
      await use_cases.create(create_valid_user_input());

      const result = await use_cases.get_by_email("test@example.com");

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should be case-insensitive for email lookup", async () => {
      await use_cases.create(create_valid_user_input());

      const result = await use_cases.get_by_email("TEST@EXAMPLE.COM");

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe("test@example.com");
    });

    it("should fail for non-existent email", async () => {
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
