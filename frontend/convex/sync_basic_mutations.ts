import { v } from "convex/values";

import { mutation } from "./_generated/server";
import type { SystemUserRecord } from "./lib/auth_middleware";
import {
  ConvexErrorCode,
  type ConvexFailure,
  log_convex_failure,
} from "./lib/convex_errors";
import { create_none_option, create_some_option } from "./lib/option";
import {
  apply_legacy_upsert,
  type ResolvedWriteOutcome,
  ResolvedWriteStatus,
  write_resolved_record,
} from "./lib/sync_legacy_writes";
import { SyncResultAction } from "./lib/sync_mutation_support";
import {
  apply_versioned_delete,
  DeleteAuditMode,
} from "./lib/sync_versioned_delete";
import { base_version_validator } from "./lib/sync_versioning";
import {
  prepare_guarded_sync_write,
  SyncPermissionMode,
} from "./lib/sync_write_pipeline";

const FORCE_RESOLVE_REJECTED_EVENT = "force_resolve_conflict_rejected";
const FORCE_RESOLVE_MISSING_BASE_EVENT = "force_resolve_conflict_missing_base";

export const upsert_record = mutation({
  args: {
    table_name: v.string(),
    local_id: v.string(),
    data: v.any(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const prepared = await prepare_guarded_sync_write(ctx, {
      table_name: args.table_name,
      local_id: args.local_id,
      incoming_record: create_some_option(args.data as Record<string, unknown>),
      permission_mode: SyncPermissionMode.FROM_EXISTING_RECORD,
    });
    if (!prepared.success) return prepared;
    const outcome = await apply_legacy_upsert(ctx, {
      table_name: prepared.table_name,
      caller: prepared.caller,
      local_id: args.local_id,
      record_data: prepared.record_data,
      existing_record: prepared.existing_record,
      legacy_incoming_version: args.version,
    });
    return {
      success: outcome.result.success,
      action: outcome.result.action,
      server_version: outcome.result.server_version,
    };
  },
});

export const delete_record = mutation({
  args: { table_name: v.string(), local_id: v.string() },
  handler: async (ctx, args) => {
    const prepared = await prepare_guarded_sync_write(ctx, {
      table_name: args.table_name,
      local_id: args.local_id,
      incoming_record: create_none_option(),
      permission_mode: SyncPermissionMode.DELETE,
    });
    if (!prepared.success) return prepared;
    const outcome = await apply_versioned_delete(ctx, {
      table_name: prepared.table_name,
      caller: prepared.caller,
      audit_mode: DeleteAuditMode.RECORD_ENTRY,
      local_id: args.local_id,
      existing_record: prepared.existing_record,
      base_version: create_none_option(),
    });
    return { success: true, action: outcome.action };
  },
});

function resolve_caller_identifier(caller: SystemUserRecord): string {
  return caller.local_id ?? String(caller._id);
}

function build_unresolved_response(
  outcome: Exclude<
    ResolvedWriteOutcome,
    { status: typeof ResolvedWriteStatus.WRITTEN }
  >,
): ConvexFailure & { action: string; server_version: number } {
  return {
    ...log_convex_failure(ConvexErrorCode.WRITE_REJECTED, {
      event: FORCE_RESOLVE_REJECTED_EVENT,
      reason: outcome.status,
      server_version: outcome.server_version,
    }),
    action:
      outcome.status === ResolvedWriteStatus.CONFLICT
        ? SyncResultAction.CONFLICT_DETECTED
        : SyncResultAction.DELETED_REMOTELY,
    server_version: outcome.server_version,
  };
}

export const force_resolve_conflict = mutation({
  args: {
    table_name: v.string(),
    local_id: v.string(),
    resolved_data: v.any(),
    new_version: v.number(),
    base_version: v.optional(base_version_validator),
    resolution_action: v.string(),
    resolved_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.base_version)
      return log_convex_failure(ConvexErrorCode.INVALID_REQUEST, {
        event: FORCE_RESOLVE_MISSING_BASE_EVENT,
        table_name: args.table_name,
      });
    const prepared = await prepare_guarded_sync_write(ctx, {
      table_name: args.table_name,
      local_id: args.local_id,
      incoming_record: create_some_option(
        args.resolved_data as Record<string, unknown>,
      ),
      permission_mode: SyncPermissionMode.FROM_EXISTING_RECORD,
    });
    if (!prepared.success) return prepared;
    const outcome = await write_resolved_record(ctx, {
      table_name: prepared.table_name,
      caller: prepared.caller,
      local_id: args.local_id,
      existing_record: prepared.existing_record,
      base_version: args.base_version,
      record_data: {
        ...prepared.record_data,
        conflict_resolved_at: new Date().toISOString(),
        conflict_resolution_action: args.resolution_action,
        conflict_resolved_by: resolve_caller_identifier(prepared.caller),
      },
    });
    if (outcome.status !== ResolvedWriteStatus.WRITTEN)
      return build_unresolved_response(outcome);
    return {
      success: true,
      action: outcome.action,
      resolution: args.resolution_action,
      server_version: outcome.server_version,
    };
  },
});
