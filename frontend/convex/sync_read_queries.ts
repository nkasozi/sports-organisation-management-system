import { v } from "convex/values";

import { query, type QueryCtx } from "./_generated/server";
import { require_auth } from "./lib/auth_middleware";
import { NO_ERROR_MESSAGE } from "./lib/convex_errors";
import { project_public_records } from "./lib/public_record_projection";
import {
  load_records_for_caller,
  load_visible_record,
  read_record_change_timestamp,
  RecordLookupStatus,
} from "./lib/sync_read_support";
import {
  type AllowedSyncTable,
  is_public_table,
  validate_table_name,
} from "./lib/sync_validation";

async function load_public_records(
  ctx: QueryCtx,
  table_name: AllowedSyncTable,
): Promise<Array<Record<string, unknown>>> {
  if (!is_public_table(table_name)) return [];
  return project_public_records(
    table_name,
    await ctx.db.query(table_name).collect(),
  );
}

export const get_changes_since = query({
  args: { table_name: v.string(), since_timestamp: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return { ...table_validation, data: [] };
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) return { ...auth_result, data: [] };
    const visible_records = await load_records_for_caller(
      ctx,
      table_validation.data,
      auth_result.data,
    );
    return {
      success: true,
      data: visible_records.filter(
        (record) => read_record_change_timestamp(record) > args.since_timestamp,
      ),
      error: NO_ERROR_MESSAGE,
    };
  },
});

export const get_all_records = query({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return [];
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return load_public_records(ctx, table_validation.data);
    return load_records_for_caller(
      ctx,
      table_validation.data,
      auth_result.data,
    );
  },
});

export const get_record_by_local_id = query({
  args: { table_name: v.string(), local_id: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return { ...table_validation, status: RecordLookupStatus.FAILURE };
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return { ...auth_result, status: RecordLookupStatus.FAILURE };
    return load_visible_record(ctx, {
      caller: auth_result.data,
      table_name: table_validation.data,
      local_id: args.local_id,
    });
  },
});
