import { v } from "convex/values";

import { query } from "./_generated/server";
import { build_scope_filter, require_auth } from "./lib/auth_middleware";
import {
  filter_records_by_organization_scope,
  get_entity_type_for_table,
  is_global_table as check_is_global_table,
  is_public_table,
  validate_table_name,
} from "./lib/sync_validation";

export const get_changes_since = query({
  args: { table_name: v.string(), since_timestamp: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return { success: false, error: table_validation.error, data: [] };
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return { success: false, error: "Access denied", data: [] };
    let all_records = await ctx.db.query(args.table_name as any).collect();
    if (!check_is_global_table(args.table_name)) {
      all_records = filter_records_by_organization_scope(
        all_records,
        auth_result.data,
        args.table_name,
        build_scope_filter(
          auth_result.data,
          get_entity_type_for_table(args.table_name),
        ),
      );
    }
    return {
      success: true,
      data: all_records.filter(
        (record: any) =>
          (record.synced_at || record.updated_at || record.created_at) >
          args.since_timestamp,
      ),
      error: null,
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
      return is_public_table(args.table_name)
        ? await ctx.db.query(args.table_name as any).collect()
        : [];
    const all_records = await ctx.db.query(args.table_name as any).collect();
    if (check_is_global_table(args.table_name)) return all_records;
    return filter_records_by_organization_scope(
      all_records,
      auth_result.data,
      args.table_name,
      build_scope_filter(
        auth_result.data,
        get_entity_type_for_table(args.table_name),
      ),
    );
  },
});

export const get_record_by_local_id = query({
  args: { table_name: v.string(), local_id: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return null;
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) return null;
    const record = await ctx.db
      .query(args.table_name as any)
      .withIndex("by_local_id", (q) => q.eq("local_id", args.local_id))
      .first();
    if (!record || check_is_global_table(args.table_name)) return record;
    const filtered = filter_records_by_organization_scope(
      [record],
      auth_result.data,
      args.table_name,
      build_scope_filter(
        auth_result.data,
        get_entity_type_for_table(args.table_name),
      ),
    );
    return filtered.length > 0 ? filtered[0] : null;
  },
});
