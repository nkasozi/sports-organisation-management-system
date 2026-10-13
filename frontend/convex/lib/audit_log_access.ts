import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import {
  type ConvexResult,
  DataAction,
  require_permission,
} from "./auth_middleware";
import {
  filter_organization_owned_records,
  resolve_caller_scope,
} from "./caller_scope";

const AUDIT_LOG_ENTITY_TYPE = "auditlog";
const AUDIT_LOGS_TABLE_NAME = "audit_logs";

export async function load_scoped_audit_logs(
  ctx: QueryCtx,
): Promise<ConvexResult<Array<Doc<"audit_logs">>>> {
  const permission_result = await require_permission(
    ctx,
    AUDIT_LOG_ENTITY_TYPE,
    DataAction.READ,
  );
  if (!permission_result.success) return permission_result;
  return {
    success: true,
    data: filter_organization_owned_records(
      await ctx.db.query(AUDIT_LOGS_TABLE_NAME).collect(),
      resolve_caller_scope(permission_result.data),
    ),
  };
}
