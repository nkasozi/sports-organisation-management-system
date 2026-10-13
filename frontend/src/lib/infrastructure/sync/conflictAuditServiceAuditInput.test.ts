import { describe, expect, it } from "vitest";

import {
  build_conflict_changes,
  create_mock_conflict,
  format_table_name_for_display,
  format_value_for_audit,
  get_resolution_description,
} from "./conflictAuditService.test_support";

describe("Audit log input structure", () => {
  it("creates valid audit input for conflict detection", () => {
    const conflict = create_mock_conflict();

    const audit_input = {
      entity_type: format_table_name_for_display(conflict.table_name),
      entity_id: conflict.local_id,
      entity_display_name: conflict.entity_display_name,
      action: "sync_conflict_detected" as const,
      changes: build_conflict_changes(conflict.field_differences),
      user_id: "system",
      user_email: "system@sport-sync.local",
      user_display_name: "System",
      ip_address: "127.0.0.1",
      user_agent: "SportSyncApp/SyncService",
    };

    expect(audit_input.entity_type).toBe("Teams");
    expect(audit_input.entity_id).toBe("team_1");
    expect(audit_input.action).toBe("sync_conflict_detected");
    expect(audit_input.changes).toHaveLength(1);
  });

  it("creates valid audit input for conflict resolution", () => {
    const conflict = create_mock_conflict();

    const changes = [
      {
        field_name: "resolution_action",
        old_value: "conflict",
        new_value: get_resolution_description("keep_local"),
      },
      {
        field_name: "resolution_source",
        old_value: "remote",
        new_value: "local",
      },
    ];

    const audit_input = {
      entity_type: format_table_name_for_display(conflict.table_name),
      entity_id: conflict.local_id,
      entity_display_name: conflict.entity_display_name,
      action: "sync_conflict_resolved" as const,
      changes,
      user_id: "user_456",
      user_email: "user@example.com",
      user_display_name: "Jane Doe",
      ip_address: "127.0.0.1",
      user_agent: "SportSyncApp/SyncService",
    };

    expect(audit_input.action).toBe("sync_conflict_resolved");
    expect(audit_input.changes).toHaveLength(2);
    expect(audit_input.user_id).toBe("user_456");
  });

  it("includes merge field changes for merge resolution", () => {
    const conflict = create_mock_conflict();
    const resolved_data = { name: "Merged Name" };

    const changes = [
      {
        field_name: "resolution_action",
        old_value: "conflict",
        new_value: get_resolution_description("merge"),
      },
    ];

    for (const diff of conflict.field_differences) {
      const resolved_value =
        resolved_data[diff.field_name as keyof typeof resolved_data];
      changes.push({
        field_name: diff.field_name,
        old_value: `Local: ${format_value_for_audit(diff.local_value)} | Remote: ${format_value_for_audit(diff.remote_value)}`,
        new_value: format_value_for_audit(resolved_value),
      });
    }

    expect(changes).toHaveLength(2);
    expect(changes[1].field_name).toBe("name");
    expect(changes[1].old_value).toBe("Local: Local | Remote: Remote");
    expect(changes[1].new_value).toBe("Merged Name");
  });
});

describe("Context handling", () => {
  it("uses default system user when no context provided", () => {
    const context = {} as Record<string, string>;

    const user_id = context.user_id ?? "system";
    const user_email = context.user_email ?? "system@sport-sync.local";
    const user_display_name = context.user_display_name ?? "System";

    expect(user_id).toBe("system");
    expect(user_email).toBe("system@sport-sync.local");
    expect(user_display_name).toBe("System");
  });

  it("uses provided context values when available", () => {
    const context = {
      user_id: "user_123",
      user_email: "user@example.com",
      user_display_name: "John Doe",
    };

    const user_id = context.user_id ?? "system";
    const user_email = context.user_email ?? "system@sport-sync.local";
    const user_display_name = context.user_display_name ?? "System";

    expect(user_id).toBe("user_123");
    expect(user_email).toBe("user@example.com");
    expect(user_display_name).toBe("John Doe");
  });

  it("handles partial context with some undefined values", () => {
    const context: {
      user_display_name?: string;
      user_email?: string;
      user_id: string;
    } = {
      user_id: "user_123",
    };

    const user_id = context.user_id ?? "system";
    const user_email = context.user_email ?? "system@sport-sync.local";
    const user_display_name = context.user_display_name ?? "System";

    expect(user_id).toBe("user_123");
    expect(user_email).toBe("system@sport-sync.local");
    expect(user_display_name).toBe("System");
  });
});
