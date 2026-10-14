import { v } from "convex/values";

import { mutation, type MutationCtx } from "./_generated/server";
import type { SystemUserRecord } from "./lib/auth_middleware";
import {
  build_caller_visible_record,
  type RemoteDataStatusValue,
} from "./lib/caller_record_projection";
import {
  type ConvexErrorCodeValue,
  type ConvexFailure,
  NO_ERROR_CODE,
  NO_ERROR_MESSAGE,
} from "./lib/convex_errors";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./lib/option";
import {
  authorize_batch_caller,
  BatchOperation,
} from "./lib/sync_batch_authorization";
import { NO_SERVER_VERSION } from "./lib/sync_batch_record_types";
import type { AllowedSyncTable } from "./lib/sync_table_catalog";
import { validate_table_name } from "./lib/sync_validation";
import { apply_versioned_delete } from "./lib/sync_versioned_delete";
import {
  base_version_validator,
  type BaseVersion,
} from "./lib/sync_versioning";
import {
  prepare_guarded_sync_write,
  SyncPermissionMode,
} from "./lib/sync_write_pipeline";
import { MAX_BATCH_SIZE, reject_oversized_batch } from "./sync_batch_mutation";

const DELETE_REJECTED_ACTION = "rejected";

interface BatchDeleteResult {
  local_id: string;
  success: boolean;
  action: string;
  server_version: number;
  error: string;
  error_code: ConvexErrorCodeValue | typeof NO_ERROR_CODE;
}

interface BatchDeleteConflict {
  local_id: string;
  remote_data: Record<string, unknown>;
  remote_data_status: RemoteDataStatusValue;
  remote_version: number;
}

interface BatchDeleteRecordOutcome {
  result: BatchDeleteResult;
  conflicts: BatchDeleteConflict[];
}

type BatchDeleteFailure = ConvexFailure & {
  results: BatchDeleteResult[];
  conflicts: BatchDeleteConflict[];
};

function build_batch_delete_failure(
  failure: ConvexFailure,
): BatchDeleteFailure {
  return { ...failure, results: [], conflicts: [] };
}

function build_rejected_delete_outcome(
  local_id: string,
  failure: ConvexFailure,
): BatchDeleteRecordOutcome {
  return {
    result: {
      local_id,
      success: false,
      action: DELETE_REJECTED_ACTION,
      server_version: NO_SERVER_VERSION,
      error: failure.error,
      error_code: failure.error_code,
    },
    conflicts: [],
  };
}

async function build_delete_conflicts(
  ctx: MutationCtx,
  command: {
    caller: SystemUserRecord;
    table_name: AllowedSyncTable;
    local_id: string;
    remote_record: Option<Record<string, unknown>>;
    remote_version: number;
  },
): Promise<BatchDeleteConflict[]> {
  if (command.remote_record.status === OptionStatus.NONE) return [];
  const visible_record = await build_caller_visible_record(ctx, {
    caller: command.caller,
    table_name: command.table_name,
    record: command.remote_record.value,
  });
  return [
    {
      local_id: command.local_id,
      ...visible_record,
      remote_version: command.remote_version,
    },
  ];
}

async function delete_single_record(
  ctx: MutationCtx,
  table_name: string,
  record: { local_id: string; base_version: BaseVersion },
): Promise<BatchDeleteRecordOutcome> {
  const prepared = await prepare_guarded_sync_write(ctx, {
    table_name,
    local_id: record.local_id,
    incoming_record: create_none_option(),
    permission_mode: SyncPermissionMode.DELETE,
  });
  if (!prepared.success)
    return build_rejected_delete_outcome(record.local_id, prepared);
  const outcome = await apply_versioned_delete(ctx, {
    table_name: prepared.table_name,
    local_id: record.local_id,
    existing_record: prepared.existing_record,
    base_version: create_some_option(record.base_version),
  });
  return {
    result: {
      local_id: record.local_id,
      success: outcome.success,
      action: outcome.action,
      server_version: outcome.server_version,
      error: NO_ERROR_MESSAGE,
      error_code: NO_ERROR_CODE,
    },
    conflicts: await build_delete_conflicts(ctx, {
      caller: prepared.caller,
      table_name: prepared.table_name,
      local_id: record.local_id,
      remote_record: outcome.remote_record,
      remote_version: outcome.server_version,
    }),
  };
}

export const batch_delete = mutation({
  args: {
    table_name: v.string(),
    records: v.array(
      v.object({ local_id: v.string(), base_version: base_version_validator }),
    ),
  },
  handler: async (ctx, args) => {
    if (args.records.length > MAX_BATCH_SIZE)
      return build_batch_delete_failure(
        reject_oversized_batch(BatchOperation.DELETE, args.records.length),
      );
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return build_batch_delete_failure(table_validation);
    const authorization = await authorize_batch_caller(ctx, {
      operation: BatchOperation.DELETE,
      table_name: table_validation.data,
      record_count: args.records.length,
    });
    if (!authorization.success)
      return build_batch_delete_failure(authorization);
    const results: BatchDeleteResult[] = [];
    const conflicts: BatchDeleteConflict[] = [];
    for (const record of args.records) {
      const outcome = await delete_single_record(ctx, args.table_name, record);
      results.push(outcome.result);
      conflicts.push(...outcome.conflicts);
    }
    return { success: true, error: NO_ERROR_MESSAGE, results, conflicts };
  },
});
