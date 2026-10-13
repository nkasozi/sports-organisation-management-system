import type { FieldChange } from "$lib/core/entities/AuditLog";
import {
  type ConflictRecord,
  create_known_conflict_field_value,
} from "$lib/infrastructure/sync/conflictTypes";

export function build_conflict_changes(
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

export function format_value_for_audit(value: unknown): string {
  if (value == void 0) {
    return value === void 0 ? "undefined" : "null";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function format_table_name_for_display(table_name: string): string {
  return table_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function get_resolution_description(
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

export function create_mock_conflict(): ConflictRecord {
  return {
    id: "conflict_teams_team_1_123456",
    table_name: "teams",
    local_id: "team_1",
    entity_display_name: "Test Team",
    local_data: { name: "Local" },
    remote_data: { name: "Remote" },
    local_updated_at: "2024-01-01T10:00:00.000Z",
    remote_updated_at: "2024-01-01T12:00:00.000Z",
    remote_updated_by: create_known_conflict_field_value("user_123"),
    remote_updated_by_name: create_known_conflict_field_value("John"),
    field_differences: [
      {
        field_name: "name",
        local_value: "Local",
        remote_value: "Remote",
        display_name: "Name",
      },
    ],
    detected_at: "2024-01-01T14:00:00.000Z",
  } as unknown as ConflictRecord;
}
