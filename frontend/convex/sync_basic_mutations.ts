import { v } from "convex/values";

import { mutation } from "./_generated/server";
import {
  create_none_option,
  create_some_option,
  OptionStatus,
} from "./lib/option";
import {
  apply_legacy_upsert,
  write_resolved_record,
} from "./lib/sync_legacy_writes";
import { SyncResultAction } from "./lib/sync_mutation_support";
import { apply_versioned_delete } from "./lib/sync_versioned_delete";
import {
  prepare_guarded_sync_write,
  SyncPermissionMode,
} from "./lib/sync_write_pipeline";
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
      local_id: args.local_id,
      record_data: prepared.record_data,
      existing_record: prepared.existing_record,
      legacy_incoming_version: args.version,
    });
    if (outcome.status === OptionStatus.NONE)
      return {
        success: true,
        action: SyncResultAction.SKIPPED,
        reason: SyncResultAction.SERVER_NEWER,
      };
    return {
      success: outcome.value.result.success,
      action: outcome.value.result.action,
      server_version: outcome.value.result.server_version,
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
      local_id: args.local_id,
      existing_record: prepared.existing_record,
      base_version: create_none_option(),
    });
    return { success: true, action: outcome.action };
  },
});

export const force_resolve_conflict = mutation({
  args: {
    table_name: v.string(),
    local_id: v.string(),
    resolved_data: v.any(),
    new_version: v.number(),
    resolution_action: v.string(),
    resolved_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prepared = await prepare_guarded_sync_write(ctx, {
      table_name: args.table_name,
      local_id: args.local_id,
      incoming_record: create_some_option(
        args.resolved_data as Record<string, unknown>,
      ),
      permission_mode: SyncPermissionMode.UPDATE,
    });
    if (!prepared.success) return prepared;
    const written = await write_resolved_record(ctx, {
      table_name: prepared.table_name,
      local_id: args.local_id,
      existing_record: prepared.existing_record,
      record_data: {
        ...prepared.record_data,
        conflict_resolved_at: new Date().toISOString(),
        conflict_resolution_action: args.resolution_action,
        ...(args.resolved_by ? { conflict_resolved_by: args.resolved_by } : {}),
      },
    });
    return {
      success: true,
      action: written.action,
      resolution: args.resolution_action,
      server_version: written.server_version,
    };
  },
});
