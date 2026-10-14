import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import {
  type ConvexResult,
  DataAction,
  require_permission,
} from "./auth_middleware";
import {
  type CallerScope,
  CallerScopeKind,
  resolve_caller_scope,
} from "./caller_scope";

const AUDIT_LOG_ENTITY_TYPE = "auditlog";
const AUDIT_LOGS_TABLE_NAME = "audit_logs";
const ORGANIZATION_TIMESTAMP_INDEX = "by_organization_timestamp";
const TIMESTAMP_INDEX = "by_timestamp";
const NEWEST_FIRST = "desc";
const EARLIEST_TIMESTAMP = "";
export const MAX_AUDIT_LOG_SCAN_ROWS = 5000;
const AUDIT_SCAN_LIMIT_REACHED_EVENT = "audit_log_scan_limit_reached";

type AuditLogDocument = Doc<"audit_logs">;

export interface AuditLogWindow {
  earliest_timestamp: string;
}

export const UNBOUNDED_AUDIT_LOG_WINDOW: AuditLogWindow = {
  earliest_timestamp: EARLIEST_TIMESTAMP,
};

async function load_logs_in_scope(
  ctx: QueryCtx,
  caller_scope: CallerScope,
  window: AuditLogWindow,
): Promise<AuditLogDocument[]> {
  switch (caller_scope.kind) {
    case CallerScopeKind.NONE:
      return [];
    case CallerScopeKind.GLOBAL:
      return ctx.db
        .query(AUDIT_LOGS_TABLE_NAME)
        .withIndex(TIMESTAMP_INDEX, (range) =>
          range.gte("timestamp", window.earliest_timestamp),
        )
        .order(NEWEST_FIRST)
        .take(MAX_AUDIT_LOG_SCAN_ROWS);
    case CallerScopeKind.ORGANIZATION:
      return ctx.db
        .query(AUDIT_LOGS_TABLE_NAME)
        .withIndex(ORGANIZATION_TIMESTAMP_INDEX, (range) =>
          range
            .eq("organization_id", caller_scope.organization_id)
            .gte("timestamp", window.earliest_timestamp),
        )
        .order(NEWEST_FIRST)
        .take(MAX_AUDIT_LOG_SCAN_ROWS);
  }
}

export async function load_scoped_audit_logs(
  ctx: QueryCtx,
  window: AuditLogWindow = UNBOUNDED_AUDIT_LOG_WINDOW,
): Promise<ConvexResult<AuditLogDocument[]>> {
  const permission_result = await require_permission(
    ctx,
    AUDIT_LOG_ENTITY_TYPE,
    DataAction.READ,
  );
  if (!permission_result.success) return permission_result;
  const logs = await load_logs_in_scope(
    ctx,
    resolve_caller_scope(permission_result.data),
    window,
  );
  if (logs.length >= MAX_AUDIT_LOG_SCAN_ROWS)
    console.warn("[AuditLogAccess] Audit log scan limit reached", {
      event: AUDIT_SCAN_LIMIT_REACHED_EVENT,
      user_id: permission_result.data._id,
      row_limit: MAX_AUDIT_LOG_SCAN_ROWS,
    });
  return { success: true, data: logs };
}
