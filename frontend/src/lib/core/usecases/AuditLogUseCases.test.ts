import { describe, it, expect, beforeEach } from "vitest";
import {
  create_audit_log_use_cases,
  type AuditLogUseCases,
} from "./AuditLogUseCases";
import {
  InBrowserAuditLogRepository,
  reset_audit_log_repository,
} from "../../adapters/repositories/InBrowserAuditLogRepository";
import type { CreateAuditLogInput } from "../entities/AuditLog";
import { compute_field_changes } from "../entities/AuditLog";

describe("AuditLogUseCases", () => {
  let use_cases: AuditLogUseCases;
  let repository: InBrowserAuditLogRepository;

  beforeEach(async () => {
    await reset_audit_log_repository();
    repository = new InBrowserAuditLogRepository();
    use_cases = create_audit_log_use_cases(repository);
  });

  function create_valid_audit_log_input(): CreateAuditLogInput {
    return {
      entity_type: "player",
      entity_id: "player_123",
      entity_display_name: "John Doe",
      action: "create",
      user_id: "user_456",
      user_email: "admin@example.com",
      user_display_name: "Admin User",
      changes: [],
    };
  }

  describe("create", () => {
    it("should create a new audit log entry successfully", async () => {
      const input = create_valid_audit_log_input();

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(result.data?.entity_type).toBe("player");
      expect(result.data?.entity_id).toBe("player_123");
      expect(result.data?.action).toBe("create");
      expect(result.data?.user_id).toBe("user_456");
    });

    it("should create audit log with field changes", async () => {
      const input: CreateAuditLogInput = {
        ...create_valid_audit_log_input(),
        action: "update",
        changes: [
          { field_name: "first_name", old_value: "John", new_value: "Jane" },
          { field_name: "status", old_value: "active", new_value: "inactive" },
        ],
      };

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(result.data?.changes.length).toBe(2);
      expect(result.data?.changes[0].field_name).toBe("first_name");
    });

    it("should reject creation with missing entity_type", async () => {
      const input = create_valid_audit_log_input();
      input.entity_type = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Entity type is required");
    });

    it("should reject creation with missing entity_id", async () => {
      const input = create_valid_audit_log_input();
      input.entity_id = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Entity ID is required");
    });

    it("should reject creation with missing user_id", async () => {
      const input = create_valid_audit_log_input();
      input.user_id = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("User ID is required");
    });
  });

  describe("get_by_id", () => {
    it("should retrieve an existing audit log by id", async () => {
      const input = create_valid_audit_log_input();
      const created = await use_cases.create(input);
      const log_id = created.data!.id;

      const result = await use_cases.get_by_id(log_id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(log_id);
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Audit log ID is required");
    });
  });

  describe("list", () => {
    it("should list all audit logs", async () => {
      await use_cases.create(create_valid_audit_log_input());
      await use_cases.create({
        ...create_valid_audit_log_input(),
        entity_id: "player_789",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it("should filter by entity_type", async () => {
      await use_cases.create(create_valid_audit_log_input());
      await use_cases.create({
        ...create_valid_audit_log_input(),
        entity_type: "team",
        entity_id: "team_123",
      });

      const result = await use_cases.list({ entity_type: "player" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].entity_type).toBe("player");
    });

    it("should filter by action", async () => {
      await use_cases.create(create_valid_audit_log_input());
      await use_cases.create({
        ...create_valid_audit_log_input(),
        entity_id: "player_789",
        action: "update",
      });

      const result = await use_cases.list({ action: "create" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].action).toBe("create");
    });
  });

  describe("update (immutability)", () => {
    it("should reject update attempts on audit logs", async () => {
      const created = await use_cases.create(create_valid_audit_log_input());
      const log_id = created.data!.id;

      const result = await use_cases.update(log_id, { entity_type: "team" });

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("immutable");
      expect(result.error_message).toContain("cannot be updated");
    });
  });

  describe("delete (immutability)", () => {
    it("should reject delete attempts on audit logs", async () => {
      const created = await use_cases.create(create_valid_audit_log_input());
      const log_id = created.data!.id;

      const result = await use_cases.delete(log_id);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("immutable");
      expect(result.error_message).toContain("cannot be deleted");
    });
  });

  describe("get_entity_history", () => {
    it("should retrieve audit logs for a specific entity", async () => {
      await use_cases.create(create_valid_audit_log_input());
      await use_cases.create({
        ...create_valid_audit_log_input(),
        action: "update",
        changes: [
          { field_name: "status", old_value: "active", new_value: "inactive" },
        ],
      });
      await use_cases.create({
        ...create_valid_audit_log_input(),
        entity_id: "other_entity",
      });

      const result = await use_cases.get_entity_history("player", "player_123");

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it("should fail with empty entity_type", async () => {
      const result = await use_cases.get_entity_history("", "player_123");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Entity type is required");
    });

    it("should fail with empty entity_id", async () => {
      const result = await use_cases.get_entity_history("player", "");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Entity ID is required");
    });
  });

  describe("get_user_activity", () => {
    it("should retrieve audit logs for a specific user", async () => {
      await use_cases.create(create_valid_audit_log_input());
      await use_cases.create({
        ...create_valid_audit_log_input(),
        entity_id: "player_789",
      });
      await use_cases.create({
        ...create_valid_audit_log_input(),
        entity_id: "team_123",
        user_id: "other_user",
      });

      const result = await use_cases.get_user_activity("user_456");

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it("should fail with empty user_id", async () => {
      const result = await use_cases.get_user_activity("");

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("User ID is required");
    });
  });
});

describe("compute_field_changes", () => {
  it("should detect changed fields", () => {
    const old_entity = { name: "John", age: 25, status: "active" };
    const new_entity = { name: "Jane", age: 25, status: "inactive" };

    const changes = compute_field_changes(old_entity, new_entity, [
      "name",
      "age",
      "status",
    ]);

    expect(changes.length).toBe(2);
    expect(changes[0]).toEqual({
      field_name: "name",
      old_value: "John",
      new_value: "Jane",
    });
    expect(changes[1]).toEqual({
      field_name: "status",
      old_value: "active",
      new_value: "inactive",
    });
  });

  it("should return empty array when no changes", () => {
    const old_entity = { name: "John", age: 25 };
    const new_entity = { name: "John", age: 25 };

    const changes = compute_field_changes(old_entity, new_entity, [
      "name",
      "age",
    ]);

    expect(changes.length).toBe(0);
  });

  it("should handle null and undefined values", () => {
    const old_entity: Record<string, unknown> = {
      name: null,
      email: undefined,
    };
    const new_entity: Record<string, unknown> = {
      name: "John",
      email: "john@example.com",
    };

    const changes = compute_field_changes(old_entity, new_entity, [
      "name",
      "email",
    ]);

    expect(changes.length).toBe(2);
    expect(changes[0].old_value).toBe("");
    expect(changes[0].new_value).toBe("John");
  });

  it("should serialize objects to JSON", () => {
    const old_entity = { data: { nested: "value" } };
    const new_entity = { data: { nested: "changed" } };

    const changes = compute_field_changes(old_entity, new_entity, ["data"]);

    expect(changes.length).toBe(1);
    expect(changes[0].old_value).toBe('{"nested":"value"}');
    expect(changes[0].new_value).toBe('{"nested":"changed"}');
  });
});
