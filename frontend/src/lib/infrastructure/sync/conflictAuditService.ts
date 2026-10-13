import type {
  AuditLog,
  CreateAuditLogInput,
  FieldChange,
} from "$lib/core/entities/AuditLog";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { Result } from "$lib/core/types/Result";
import { get_repository_container } from "$lib/infrastructure/container";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";

import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import {
  build_conflict_changes,
  build_resolution_changes,
} from "./conflictAuditChanges";

interface ConflictAuditContext {
  user_id?: CreateAuditLogInput["user_id"];
  user_email?: CreateAuditLogInput["user_email"];
  user_display_name?: CreateAuditLogInput["user_display_name"];
  organization_id?: AuditLog["organization_id"];
}

const CONFLICT_DETECTED_AUDIT_ACTION = "sync_conflict_detected";
const CONFLICT_RESOLVED_AUDIT_ACTION = "sync_conflict_resolved";
const SYSTEM_USER_ID = "system";
const SYSTEM_USER_EMAIL = "system@sport-sync.local";
const SYSTEM_USER_DISPLAY_NAME = "System";
const SYSTEM_IP_ADDRESS = "127.0.0.1";
const SYSTEM_USER_AGENT = "SportSyncApp/SyncService";

const CONFLICT_AUDIT_WRITE_FAILED_EVENT = "conflict_audit_write_failed";

function report_audit_write(
  created: Result<unknown>,
  conflict: ScalarInput<ConflictRecord>,
  audit_action: string,
): boolean {
  if (created.success) return true;
  console.error("[ConflictAudit] Audit log entry was not saved", {
    event: CONFLICT_AUDIT_WRITE_FAILED_EVENT,
    audit_action,
    table_name: conflict.table_name,
    local_id: conflict.local_id,
    error: created.error,
  });
  return false;
}

function format_table_name_for_display(table_name: string): string {
  return table_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function build_conflict_audit_input(
  conflict: ScalarInput<ConflictRecord>,
  action: CreateAuditLogInput["action"],
  changes: FieldChange[],
  context: ConflictAuditContext,
): CreateAuditLogInput {
  return {
    entity_type: format_table_name_for_display(conflict.table_name),
    entity_id: conflict.local_id,
    entity_display_name: conflict.entity_display_name,
    action,
    changes,
    user_id: context.user_id ?? SYSTEM_USER_ID,
    user_email: context.user_email ?? SYSTEM_USER_EMAIL,
    user_display_name: context.user_display_name ?? SYSTEM_USER_DISPLAY_NAME,
    organization_id: context.organization_id ?? WILDCARD_SCOPE,
    ip_address: SYSTEM_IP_ADDRESS,
    user_agent: SYSTEM_USER_AGENT,
  };
}

export async function log_conflict_detected(
  conflict: ScalarInput<ConflictRecord>,
  context: ConflictAuditContext = {},
): Promise<boolean> {
  try {
    const audit_log_repository =
      get_repository_container().audit_log_repository;
    const audit_input = build_conflict_audit_input(
      conflict,
      CONFLICT_DETECTED_AUDIT_ACTION,
      build_conflict_changes(conflict.field_differences),
      context,
    );
    const created = await audit_log_repository.create(audit_input);
    return report_audit_write(
      created,
      conflict,
      CONFLICT_DETECTED_AUDIT_ACTION,
    );
  } catch (error) {
    console.error("[ConflictAudit] Failed to log conflict detected", {
      event: "failed_to_log_conflict_detected_failed",
      error: String(error),
    });
    return false;
  }
}

export async function log_conflict_resolution(
  conflict: ScalarInput<ConflictRecord>,
  resolution_action: ConflictResolutionAction,
  resolved_data: Record<string, unknown>,
  context: ConflictAuditContext = {},
): Promise<boolean> {
  try {
    const audit_log_repository =
      get_repository_container().audit_log_repository;
    const changes = build_resolution_changes(
      conflict,
      resolution_action,
      resolved_data,
    );
    const created = await audit_log_repository.create(
      build_conflict_audit_input(
        conflict,
        CONFLICT_RESOLVED_AUDIT_ACTION,
        changes,
        context,
      ),
    );
    return report_audit_write(
      created,
      conflict,
      CONFLICT_RESOLVED_AUDIT_ACTION,
    );
  } catch (error) {
    console.error("[ConflictAudit] Failed to log conflict resolution", {
      event: "failed_to_log_conflict_resolution_failed",
      error: String(error),
    });
    return false;
  }
}

async function log_multiple_conflicts_detected(
  conflicts: ConflictRecord[],
  context: ConflictAuditContext = {},
): Promise<{ success_count: number; failure_count: number }> {
  const outcomes: boolean[] = [];
  for (const conflict of conflicts)
    outcomes.push(await log_conflict_detected(conflict, context));
  const success_count = outcomes.filter(Boolean).length;
  return { success_count, failure_count: outcomes.length - success_count };
}
