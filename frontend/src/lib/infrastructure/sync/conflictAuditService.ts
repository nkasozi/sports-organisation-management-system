import { get_repository_container } from "$lib/infrastructure/container";
import type {
  CreateAuditLogInput,
  FieldChange,
} from "$lib/core/entities/AuditLog";
import type {
  ConflictRecord,
  ConflictResolutionAction,
  FieldDifference,
} from "$lib/infrastructure/sync/conflictTypes";

export interface ConflictAuditContext {
  user_id?: string;
  user_email?: string;
  user_display_name?: string;
}

function build_conflict_changes(
  field_differences: FieldDifference[],
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

export async function log_conflict_detected(
  conflict: ConflictRecord,
  context: ConflictAuditContext = {},
): Promise<boolean> {
  try {
    const container = get_repository_container();
    const audit_log_repository = container.audit_log_repository;

    const audit_input: CreateAuditLogInput = {
      entity_type: format_table_name_for_display(conflict.table_name),
      entity_id: conflict.local_id,
      entity_display_name: conflict.entity_display_name,
      action: "sync_conflict_detected",
      changes: build_conflict_changes(conflict.field_differences),
      user_id: context.user_id ?? "system",
      user_email: context.user_email ?? "system@sportsorg.local",
      user_display_name: context.user_display_name ?? "System",
      ip_address: "127.0.0.1",
      user_agent: "SportsOrgApp/SyncService",
    };

    await audit_log_repository.create(audit_input);
    return true;
  } catch (error) {
    console.error("[ConflictAudit] Failed to log conflict detected:", error);
    return false;
  }
}

export async function log_conflict_resolution(
  conflict: ConflictRecord,
  resolution_action: ConflictResolutionAction,
  resolved_data: Record<string, unknown>,
  context: ConflictAuditContext = {},
): Promise<boolean> {
  try {
    const container = get_repository_container();
    const audit_log_repository = container.audit_log_repository;

    const resolution_description =
      get_resolution_description(resolution_action);

    const changes: FieldChange[] = [
      {
        field_name: "resolution_action",
        old_value: "conflict",
        new_value: resolution_description,
      },
    ];

    if (resolution_action === "keep_local") {
      changes.push({
        field_name: "resolution_source",
        old_value: "remote",
        new_value: "local",
      });
    } else if (resolution_action === "keep_remote") {
      changes.push({
        field_name: "resolution_source",
        old_value: "local",
        new_value: "remote",
      });
    } else if (resolution_action === "merge") {
      for (const diff of conflict.field_differences) {
        const resolved_value = resolved_data[diff.field_name];
        changes.push({
          field_name: diff.field_name,
          old_value: `Local: ${format_value_for_audit(diff.local_value)} | Remote: ${format_value_for_audit(diff.remote_value)}`,
          new_value: format_value_for_audit(resolved_value),
        });
      }
    }

    const audit_input: CreateAuditLogInput = {
      entity_type: format_table_name_for_display(conflict.table_name),
      entity_id: conflict.local_id,
      entity_display_name: conflict.entity_display_name,
      action: "sync_conflict_resolved",
      changes,
      user_id: context.user_id ?? "system",
      user_email: context.user_email ?? "system@sportsorg.local",
      user_display_name: context.user_display_name ?? "System",
      ip_address: "127.0.0.1",
      user_agent: "SportsOrgApp/SyncService",
    };

    await audit_log_repository.create(audit_input);
    return true;
  } catch (error) {
    console.error("[ConflictAudit] Failed to log conflict resolution:", error);
    return false;
  }
}

function get_resolution_description(action: ConflictResolutionAction): string {
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

export async function log_multiple_conflicts_detected(
  conflicts: ConflictRecord[],
  context: ConflictAuditContext = {},
): Promise<{ success_count: number; failure_count: number }> {
  let success_count = 0;
  let failure_count = 0;

  for (const conflict of conflicts) {
    const success = await log_conflict_detected(conflict, context);
    if (success) {
      success_count++;
    } else {
      failure_count++;
    }
  }

  return { success_count, failure_count };
}
