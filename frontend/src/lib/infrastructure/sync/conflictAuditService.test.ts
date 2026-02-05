import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ConflictRecord } from "$lib/infrastructure/sync/conflictTypes";
import type { FieldChange } from "$lib/core/entities/AuditLog";

function build_conflict_changes(
  field_differences: Array<{
    field_name: string;
    local_value: unknown;
    remote_value: unknown;
    display_name: string;
  }>,
): FieldChange[] {
  return field_differences.map((diff) => ({
    field_name: diff.field_name,
    old_value: `Local: ${format_value_for_audit(diff.local_value)}`,
    new_value: `Remote: ${format_value_for_audit(diff.remote_value)}`,
  }));
}

function format_value_for_audit(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function format_table_name_for_display(table_name: string): string {
  return table_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function get_resolution_description(
  action: "keep_local" | "keep_remote" | "merge",
): string {
  switch (action) {
    case "keep_local":
      return "Kept local changes (overwrote server)";
    case "keep_remote":
      return "Kept server version (discarded local)";
    case "merge":
      return "Manual merge of local and remote changes";
    default:
      return "Unknown resolution";
  }
}

describe("format_value_for_audit", () => {
  it("formats null as string null", () => {
    expect(format_value_for_audit(null)).toBe("null");
  });

  it("formats undefined as string undefined", () => {
    expect(format_value_for_audit(undefined)).toBe("undefined");
  });

  it("formats objects as JSON strings", () => {
    const result = format_value_for_audit({ name: "test", count: 5 });
    expect(result).toBe('{"name":"test","count":5}');
  });

  it("formats arrays as JSON strings", () => {
    const result = format_value_for_audit(["a", "b", "c"]);
    expect(result).toBe('["a","b","c"]');
  });

  it("formats strings as-is", () => {
    expect(format_value_for_audit("hello")).toBe("hello");
  });

  it("formats numbers as strings", () => {
    expect(format_value_for_audit(42)).toBe("42");
    expect(format_value_for_audit(3.14)).toBe("3.14");
  });

  it("formats booleans as strings", () => {
    expect(format_value_for_audit(true)).toBe("true");
    expect(format_value_for_audit(false)).toBe("false");
  });

  it("formats empty object", () => {
    expect(format_value_for_audit({})).toBe("{}");
  });

  it("formats empty array", () => {
    expect(format_value_for_audit([])).toBe("[]");
  });

  it("formats nested objects", () => {
    const result = format_value_for_audit({
      outer: { inner: "value" },
    });
    expect(result).toBe('{"outer":{"inner":"value"}}');
  });
});

describe("format_table_name_for_display", () => {
  it("converts snake_case to Title Case", () => {
    expect(format_table_name_for_display("team_staff_roles")).toBe(
      "Team Staff Roles",
    );
  });

  it("handles single word table names", () => {
    expect(format_table_name_for_display("teams")).toBe("Teams");
  });

  it("handles multiple underscores", () => {
    expect(format_table_name_for_display("player_team_memberships")).toBe(
      "Player Team Memberships",
    );
  });

  it("handles table names without underscores", () => {
    expect(format_table_name_for_display("organizations")).toBe(
      "Organizations",
    );
  });
});

describe("build_conflict_changes", () => {
  it("builds field changes with local and remote prefixes", () => {
    const differences = [
      {
        field_name: "name",
        local_value: "Local Name",
        remote_value: "Remote Name",
        display_name: "Name",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes).toHaveLength(1);
    expect(changes[0].field_name).toBe("name");
    expect(changes[0].old_value).toBe("Local: Local Name");
    expect(changes[0].new_value).toBe("Remote: Remote Name");
  });

  it("handles multiple field differences", () => {
    const differences = [
      {
        field_name: "name",
        local_value: "A",
        remote_value: "B",
        display_name: "Name",
      },
      {
        field_name: "city",
        local_value: "X",
        remote_value: "Y",
        display_name: "City",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes).toHaveLength(2);
    expect(changes[0].field_name).toBe("name");
    expect(changes[1].field_name).toBe("city");
  });

  it("formats null values in changes", () => {
    const differences = [
      {
        field_name: "optional",
        local_value: null,
        remote_value: "value",
        display_name: "Optional",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes[0].old_value).toBe("Local: null");
    expect(changes[0].new_value).toBe("Remote: value");
  });

  it("formats undefined values in changes", () => {
    const differences = [
      {
        field_name: "field",
        local_value: "value",
        remote_value: undefined,
        display_name: "Field",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes[0].old_value).toBe("Local: value");
    expect(changes[0].new_value).toBe("Remote: undefined");
  });

  it("formats object values in changes", () => {
    const differences = [
      {
        field_name: "metadata",
        local_value: { color: "red" },
        remote_value: { color: "blue" },
        display_name: "Metadata",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes[0].old_value).toBe('Local: {"color":"red"}');
    expect(changes[0].new_value).toBe('Remote: {"color":"blue"}');
  });

  it("returns empty array for no differences", () => {
    const changes = build_conflict_changes([]);

    expect(changes).toEqual([]);
  });
});

describe("get_resolution_description", () => {
  it("returns correct description for keep_local", () => {
    expect(get_resolution_description("keep_local")).toBe(
      "Kept local changes (overwrote server)",
    );
  });

  it("returns correct description for keep_remote", () => {
    expect(get_resolution_description("keep_remote")).toBe(
      "Kept server version (discarded local)",
    );
  });

  it("returns correct description for merge", () => {
    expect(get_resolution_description("merge")).toBe(
      "Manual merge of local and remote changes",
    );
  });
});

describe("Audit log input structure", () => {
  function create_mock_conflict(): ConflictRecord {
    return {
      id: "conflict_teams_team_1_123456",
      table_name: "teams",
      local_id: "team_1",
      entity_display_name: "Test Team",
      local_data: { name: "Local" },
      remote_data: { name: "Remote" },
      local_updated_at: "2024-01-01T10:00:00.000Z",
      remote_updated_at: "2024-01-01T12:00:00.000Z",
      remote_updated_by: "user_123",
      remote_updated_by_name: "John",
      field_differences: [
        {
          field_name: "name",
          local_value: "Local",
          remote_value: "Remote",
          display_name: "Name",
        },
      ],
      detected_at: "2024-01-01T14:00:00.000Z",
    };
  }

  it("creates valid audit input for conflict detection", () => {
    const conflict = create_mock_conflict();

    const audit_input = {
      entity_type: format_table_name_for_display(conflict.table_name),
      entity_id: conflict.local_id,
      entity_display_name: conflict.entity_display_name,
      action: "sync_conflict_detected" as const,
      changes: build_conflict_changes(conflict.field_differences),
      user_id: "system",
      user_email: "system@sportsorg.local",
      user_display_name: "System",
      ip_address: "127.0.0.1",
      user_agent: "SportsOrgApp/SyncService",
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
      user_agent: "SportsOrgApp/SyncService",
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
      const resolved_value = resolved_data[diff.field_name as keyof typeof resolved_data];
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
    const context = {};

    const user_id = context.user_id ?? "system";
    const user_email = context.user_email ?? "system@sportsorg.local";
    const user_display_name = context.user_display_name ?? "System";

    expect(user_id).toBe("system");
    expect(user_email).toBe("system@sportsorg.local");
    expect(user_display_name).toBe("System");
  });

  it("uses provided context values when available", () => {
    const context = {
      user_id: "user_123",
      user_email: "user@example.com",
      user_display_name: "John Doe",
    };

    const user_id = context.user_id ?? "system";
    const user_email = context.user_email ?? "system@sportsorg.local";
    const user_display_name = context.user_display_name ?? "System";

    expect(user_id).toBe("user_123");
    expect(user_email).toBe("user@example.com");
    expect(user_display_name).toBe("John Doe");
  });

  it("handles partial context with some undefined values", () => {
    const context = {
      user_id: "user_123",
      user_email: undefined,
      user_display_name: undefined,
    };

    const user_id = context.user_id ?? "system";
    const user_email = context.user_email ?? "system@sportsorg.local";
    const user_display_name = context.user_display_name ?? "System";

    expect(user_id).toBe("user_123");
    expect(user_email).toBe("system@sportsorg.local");
    expect(user_display_name).toBe("System");
  });
});
