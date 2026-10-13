import type { MutationCtx } from "../_generated/server";
import {
  DataAction,
  require_permission,
  type SystemUserRecord,
} from "./auth_middleware";
import {
  ConvexErrorCode,
  type ConvexErrorCodeValue,
  type ConvexFailure,
} from "./convex_errors";
import { type Option, OptionStatus } from "./option";
import { schedule_security_audit } from "./security_audit_scheduler";
import { SecurityEventType } from "./security_event_types";
import {
  type AllowedSyncTable,
  get_entity_type_for_table,
} from "./sync_table_catalog";
import {
  SYNC_WRITE_REJECTION_MESSAGES,
  SyncWriteRejection,
  type SyncWriteRejectionValue,
  SyncWriteStatus,
} from "./sync_write_decision";
import {
  audit_rejected_sync_write,
  guard_sync_record_write,
  type SyncWriteCommand,
} from "./sync_write_guard";

export const SyncResultAction = {
  CREATED: "created",
  UPDATED: "updated",
  SKIPPED: "skipped",
  DELETED: "deleted",
  NOT_FOUND: "not_found",
  CONFLICT_RESOLVED: "conflict_resolved",
  CREATED_AFTER_CONFLICT: "created_after_conflict",
  SERVER_NEWER: "server_newer",
  CONFLICT_DETECTED: "conflict_detected",
  DELETED_REMOTELY: "deleted_remotely",
} as const;

const EMPTY_AUDIT_VALUE = "";

type GuardedWriteResult =
  | { success: true; record_data: Record<string, unknown> }
  | (ConvexFailure & { rejection: SyncWriteRejectionValue });

function error_code_for_rejection(
  rejection: SyncWriteRejectionValue,
): ConvexErrorCodeValue {
  switch (rejection) {
    case SyncWriteRejection.PRIVILEGE_CHANGE:
    case SyncWriteRejection.WRONG_ORGANIZATION:
    case SyncWriteRejection.PERMISSION_DENIED:
    case SyncWriteRejection.OUTSIDE_CALLER_SCOPE:
    case SyncWriteRejection.VERIFICATION_CHANGE:
      return ConvexErrorCode.ACCESS_DENIED;
    case SyncWriteRejection.INVALID_URL:
    case SyncWriteRejection.MISSING_EMAIL:
      return ConvexErrorCode.INVALID_REQUEST;
  }
}

export async function authorize_sync_action(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  local_id: string,
  action: DataAction,
): Promise<{ success: true; data: SystemUserRecord } | ConvexFailure> {
  const entity_type = get_entity_type_for_table(table_name);
  const permission_result = await require_permission(ctx, entity_type, action);
  if (permission_result.success) return permission_result;
  await schedule_security_audit(ctx, {
    event_type: SecurityEventType.ACCESS_DENIED,
    entity_type,
    entity_id: local_id,
    user_email: EMPTY_AUDIT_VALUE,
    organization_id: EMPTY_AUDIT_VALUE,
    details: `Permission denied for ${action} on ${table_name}`,
  });
  return permission_result;
}

export async function run_guarded_write(
  ctx: MutationCtx,
  command: SyncWriteCommand,
): Promise<GuardedWriteResult> {
  const decision = await guard_sync_record_write(ctx, command);
  if (decision.status === SyncWriteStatus.ALLOWED)
    return { success: true, record_data: decision.record_data };
  await audit_rejected_sync_write(ctx, command, decision);
  return {
    success: false,
    error_code: error_code_for_rejection(decision.rejection),
    error: SYNC_WRITE_REJECTION_MESSAGES[decision.rejection],
    rejection: decision.rejection,
  };
}

export function action_for_existing(
  existing_record: Option<Record<string, unknown>>,
): Extract<DataAction, "create" | "update"> {
  return existing_record.status === OptionStatus.SOME
    ? DataAction.UPDATE
    : DataAction.CREATE;
}
