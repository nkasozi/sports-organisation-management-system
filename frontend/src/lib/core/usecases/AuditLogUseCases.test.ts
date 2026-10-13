import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateAuditLogInput } from "../entities/AuditLog";
import type { AuditLogRepository } from "../interfaces/ports";
import {
  type AuditLogUseCases,
  create_audit_log_use_cases,
} from "./AuditLogUseCases";
import {
  create_mock_audit_log,
  create_mock_repository,
  create_success_result,
  create_valid_audit_log_input,
  type MockRepository,
} from "./AuditLogUseCases.test_support";

describe("AuditLogUseCases", () => {
  let use_cases: AuditLogUseCases;
  let mock_repository: MockRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_audit_log_use_cases(
      mock_repository as unknown as AuditLogRepository,
    );
  });

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
      const input = {
        ...create_valid_audit_log_input(),
        action: "update",
        changes,
      } as CreateAuditLogInput;
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
});
