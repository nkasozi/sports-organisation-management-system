import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  create_audit_log_use_cases,
  type AuditLogUseCases,
} from "./AuditLogUseCases";
import type { InBrowserAuditLogRepository } from "../../adapters/repositories/InBrowserAuditLogRepository";
import type { AuditLog, CreateAuditLogInput } from "../entities/AuditLog";
import { compute_field_changes } from "../entities/AuditLog";
import type { Result, PaginatedResult } from "../types/Result";

type MockRepository = Partial<InBrowserAuditLogRepository> & {
  find_all: ReturnType<typeof vi.fn>;
  find_by_id: ReturnType<typeof vi.fn>;
  find_by_ids: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete_by_id: ReturnType<typeof vi.fn>;
  delete_by_ids: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  find_by_filter: ReturnType<typeof vi.fn>;
  find_by_entity: ReturnType<typeof vi.fn>;
};

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
    find_by_filter: vi.fn(),
    find_by_entity: vi.fn(),
  };
}

function create_mock_audit_log(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: "log_1",
    entity_type: "player",
    entity_id: "player_123",
    entity_display_name: "John Doe",
    action: "create",
    user_id: "user_456",
    user_email: "admin@example.com",
    user_display_name: "Admin User",
    organization_id: "org_1",
    changes: [],
    timestamp: "2024-01-01T00:00:00Z",
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
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

describe("AuditLogUseCases", () => {
  let use_cases: AuditLogUseCases;
  let mock_repository: MockRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_audit_log_use_cases(
      mock_repository as unknown as InBrowserAuditLogRepository,
    );
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
      organization_id: "org_1",
      changes: [],
    };
  }

  describe("create", () => {
    it("should create a new audit log entry successfully", async () => {
      const input = create_valid_audit_log_input();
      const created_log = create_mock_audit_log();
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(created_log),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.entity_type).toBe("player");
      expect(result.data?.entity_id).toBe("player_123");
      expect(result.data?.action).toBe("create");
      expect(result.data?.user_id).toBe("user_456");
    });

    it("should create audit log with field changes", async () => {
      const changes = [
        { field_name: "first_name", old_value: "John", new_value: "Jane" },
        { field_name: "status", old_value: "active", new_value: "inactive" },
      ];
      const input: CreateAuditLogInput = {
        ...create_valid_audit_log_input(),
        action: "update",
        changes,
      };
      const created_log = create_mock_audit_log({
        action: "update",
        changes,
      });
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(created_log),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.changes.length).toBe(2);
      expect(result.data?.changes[0].field_name).toBe("first_name");
    });

    it("should reject creation with missing entity_type", async () => {
      const input = create_valid_audit_log_input();
      input.entity_type = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Entity type is required");
    });

    it("should reject creation with missing entity_id", async () => {
      const input = create_valid_audit_log_input();
      input.entity_id = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Entity ID is required");
    });

    it("should reject creation with missing user_id", async () => {
      const input = create_valid_audit_log_input();
      input.user_id = "";

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("User ID is required");
    });
  });

  describe("get_by_id", () => {
    it("should retrieve an existing audit log by id", async () => {
      const log = create_mock_audit_log();
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(log),
      );

      const result = await use_cases.get_by_id("log_1");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.id).toBe("log_1");
    });

    it("should fail with empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Audit log ID is required");
    });
  });

  describe("list", () => {
    it("should list all audit logs", async () => {
      const logs = [
        create_mock_audit_log({ id: "log_1" }),
        create_mock_audit_log({ id: "log_2", entity_id: "player_789" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(logs),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it("should filter by entity_type", async () => {
      const logs = [
        create_mock_audit_log({ id: "log_1", entity_type: "player" }),
      ];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(logs),
      );

      const result = await use_cases.list({ entity_type: "player" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].entity_type).toBe("player");
    });

    it("should filter by action", async () => {
      const logs = [create_mock_audit_log({ id: "log_1", action: "create" })];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(logs),
      );

      const result = await use_cases.list({ action: "create" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].action).toBe("create");
    });
  });

  describe("update (immutability)", () => {
    it("should reject update attempts on audit logs", async () => {
      const result = await use_cases.update("log_1", { entity_type: "team" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("immutable");
      expect(result.error).toContain("cannot be updated");
    });
  });

  describe("delete (immutability)", () => {
    it("should reject delete attempts on audit logs", async () => {
      const result = await use_cases.delete("log_1");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("immutable");
      expect(result.error).toContain("cannot be deleted");
    });
  });

  describe("get_entity_history", () => {
    it("should retrieve audit logs for a specific entity", async () => {
      const logs = [
        create_mock_audit_log({ id: "log_1", entity_id: "player_123" }),
        create_mock_audit_log({
          id: "log_2",
          entity_id: "player_123",
          action: "update",
        }),
      ];
      vi.mocked(mock_repository.find_by_entity).mockResolvedValue(
        create_paginated_result(logs),
      );

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
      const logs = [
        create_mock_audit_log({ id: "log_1", user_id: "user_456" }),
        create_mock_audit_log({
          id: "log_2",
          user_id: "user_456",
          entity_id: "player_789",
        }),
      ];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(logs),
      );

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
