import type { MutationCtx } from "../_generated/server";
import { DataAction } from "./auth_middleware";
import type { ConvexFailure } from "./convex_errors";
import { type Option, OptionStatus } from "./option";
import {
  action_for_existing,
  authorize_sync_action,
  run_guarded_write,
} from "./sync_mutation_support";
import { load_existing_sync_record } from "./sync_record_store";
import { type AllowedSyncTable, validate_table_name } from "./sync_validation";

export const SyncPermissionMode = {
  FROM_EXISTING_RECORD: "from_existing_record",
  UPDATE: "update",
  DELETE: "delete",
} as const;

type SyncPermissionModeValue =
  (typeof SyncPermissionMode)[keyof typeof SyncPermissionMode];

interface SyncWritePipelineCommand {
  table_name: string;
  local_id: string;
  incoming_record: Option<Record<string, unknown>>;
  permission_mode: SyncPermissionModeValue;
}

type PreparedSyncWrite =
  | {
      success: true;
      table_name: AllowedSyncTable;
      existing_record: Option<Record<string, unknown>>;
      record_data: Record<string, unknown>;
    }
  | ConvexFailure;

function resolve_permission_action(
  permission_mode: SyncPermissionModeValue,
  existing_record: Option<Record<string, unknown>>,
): DataAction {
  switch (permission_mode) {
    case SyncPermissionMode.FROM_EXISTING_RECORD:
      return action_for_existing(existing_record);
    case SyncPermissionMode.UPDATE:
      return DataAction.UPDATE;
    case SyncPermissionMode.DELETE:
      return DataAction.DELETE;
  }
}

export async function prepare_guarded_sync_write(
  ctx: MutationCtx,
  command: SyncWritePipelineCommand,
): Promise<PreparedSyncWrite> {
  const table_validation = validate_table_name(command.table_name);
  if (!table_validation.success) return table_validation;
  const table_name = table_validation.data;
  const existing_record = await load_existing_sync_record(
    ctx,
    table_name,
    command.local_id,
  );
  const authorization = await authorize_sync_action(
    ctx,
    table_name,
    command.local_id,
    resolve_permission_action(command.permission_mode, existing_record),
  );
  if (!authorization.success) return authorization;
  if (
    command.permission_mode === SyncPermissionMode.DELETE &&
    existing_record.status === OptionStatus.NONE
  )
    return { success: true, table_name, existing_record, record_data: {} };
  const guarded_write = await run_guarded_write(ctx, {
    table_name,
    caller: authorization.data,
    local_id: command.local_id,
    incoming_record: command.incoming_record,
    existing_record,
  });
  if (!guarded_write.success) return guarded_write;
  return {
    success: true,
    table_name,
    existing_record,
    record_data: guarded_write.record_data,
  };
}
