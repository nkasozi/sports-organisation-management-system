import type { MutationCtx } from "../_generated/server";
import {
  check_permission,
  type ConvexResult,
  DataAction,
  get_entity_data_category,
  require_auth,
  type SystemUserRecord,
} from "./auth_middleware";
import { ConvexErrorCode, log_convex_failure } from "./convex_errors";
import { schedule_security_audit } from "./security_audit_scheduler";
import { SecurityEventType } from "./security_event_types";
import { get_entity_type_for_table } from "./sync_table_catalog";

const EMPTY_AUDIT_VALUE = "";
const BATCH_PERMISSION_DENIED_EVENT = "batch_permission_denied";

export const BatchOperation = {
  UPSERT: "batch_upsert",
  DELETE: "batch_delete",
} as const;

type BatchOperationValue = (typeof BatchOperation)[keyof typeof BatchOperation];

interface BatchCallerCommand {
  operation: BatchOperationValue;
  table_name: string;
  record_count: number;
}

function list_required_actions(operation: BatchOperationValue): DataAction[] {
  switch (operation) {
    case BatchOperation.UPSERT:
      return [DataAction.CREATE, DataAction.UPDATE];
    case BatchOperation.DELETE:
      return [DataAction.DELETE];
  }
}

async function audit_unauthenticated_batch(
  ctx: MutationCtx,
  command: BatchCallerCommand,
): Promise<boolean> {
  await schedule_security_audit(ctx, {
    event_type: SecurityEventType.AUTH_FAILURE,
    entity_type: get_entity_type_for_table(command.table_name),
    entity_id: EMPTY_AUDIT_VALUE,
    user_email: EMPTY_AUDIT_VALUE,
    organization_id: EMPTY_AUDIT_VALUE,
    details: `Unauthenticated ${command.operation} attempt on ${command.table_name} with ${command.record_count} records`,
  });
  return true;
}

export async function authorize_batch_caller(
  ctx: MutationCtx,
  command: BatchCallerCommand,
): Promise<ConvexResult<SystemUserRecord>> {
  const entity_type = get_entity_type_for_table(command.table_name);
  const auth_result = await require_auth(ctx);
  if (!auth_result.success) {
    await audit_unauthenticated_batch(ctx, command);
    return auth_result;
  }
  const user_role = auth_result.data.role;
  const data_category = get_entity_data_category(entity_type);
  const required_actions = list_required_actions(command.operation);
  if (
    required_actions.some((action) =>
      check_permission(user_role, data_category, action),
    )
  )
    return auth_result;
  await schedule_security_audit(ctx, {
    event_type: SecurityEventType.ACCESS_DENIED,
    entity_type,
    entity_id: EMPTY_AUDIT_VALUE,
    user_email: auth_result.data.email,
    organization_id: auth_result.data.organization_id ?? EMPTY_AUDIT_VALUE,
    details: `Role "${user_role}" denied ${required_actions.join("/")} on "${entity_type}" (${command.record_count} records)`,
  });
  return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
    event: BATCH_PERMISSION_DENIED_EVENT,
    user_id: auth_result.data._id,
    role: user_role,
    operation: command.operation,
    entity_type,
    record_count: command.record_count,
  });
}
