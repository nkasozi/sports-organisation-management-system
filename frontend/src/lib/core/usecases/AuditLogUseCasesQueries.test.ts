import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuditLogRepository } from "../interfaces/ports";
import {
  type AuditLogUseCases,
  create_audit_log_use_cases,
} from "./AuditLogUseCases";
import {
  create_mock_audit_log,
  create_mock_repository,
  create_paginated_result,
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
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
    });

    it("should filter by entity_type", async () => {
      const logs = [
        create_mock_audit_log({ id: "log_1", entity_type: "player" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(logs),
      );

      const result = await use_cases.list({ entity_type: "player" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].entity_type).toBe("player");
    });

    it("should filter by action", async () => {
      const logs = [create_mock_audit_log({ id: "log_1", action: "create" })];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(logs),
      );

      const result = await use_cases.list({ action: "create" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].action).toBe("create");
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
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
    });

    it("should fail with empty entity_type", async () => {
      const result = await use_cases.get_entity_history("", "player_123");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Entity type is required");
    });

    it("should fail with empty entity_id", async () => {
      const result = await use_cases.get_entity_history("player", "");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Entity ID is required");
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
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(logs),
      );

      const result = await use_cases.get_user_activity("user_456");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
    });

    it("should fail with empty user_id", async () => {
      const result = await use_cases.get_user_activity("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("User ID is required");
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
});
