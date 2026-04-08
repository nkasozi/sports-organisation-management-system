import { v } from "convex/values";

import { query } from "./_generated/server";
import { build_scope_filter, require_auth } from "./lib/auth_middleware";
import {
  filter_records_by_organization_scope,
  get_entity_type_for_table,
  is_global_table as check_is_global_table,
  validate_table_name,
} from "./lib/sync_validation";
import { strip_convex_fields } from "./sync_record_helpers";

export const get_latest_modified_at = query({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return {
        table_name: args.table_name,
        record_count: 0,
        latest_modified_at: null,
      };
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return {
        table_name: args.table_name,
        record_count: 0,
        latest_modified_at: null,
      };
    let records = await ctx.db.query(args.table_name as any).collect();
    if (!check_is_global_table(args.table_name))
      records = filter_records_by_organization_scope(
        records,
        auth_result.data,
        args.table_name,
        build_scope_filter(
          auth_result.data,
          get_entity_type_for_table(args.table_name),
        ),
      );
    let latest_modified_at = "";
    for (const record of records) {
      const timestamp =
        (record as any).updated_at ||
        (record as any).modified_at ||
        (record as any).created_at ||
        "";
      if (timestamp > latest_modified_at) latest_modified_at = timestamp;
    }
    return {
      table_name: args.table_name,
      record_count: records.length,
      latest_modified_at: latest_modified_at || null,
    };
  },
});

export const get_sync_metadata = query({
  args: { table_name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) return null;
    return args.table_name
      ? await ctx.db
          .query("sync_metadata")
          .withIndex("by_table", (q) => q.eq("table_name", args.table_name!))
          .first()
      : await ctx.db.query("sync_metadata").collect();
  },
});

export const subscribe_to_table_changes = query({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return {
        table_name: args.table_name,
        record_count: 0,
        latest_timestamp: "",
        records: [],
      };
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return {
        table_name: args.table_name,
        record_count: 0,
        latest_timestamp: "",
        records: [],
      };
    let records = await ctx.db.query(args.table_name as any).collect();
    if (!check_is_global_table(args.table_name))
      records = filter_records_by_organization_scope(
        records,
        auth_result.data,
        args.table_name,
        build_scope_filter(
          auth_result.data,
          get_entity_type_for_table(args.table_name),
        ),
      );
    const latest_timestamp = records.reduce((latest: string, record: any) => {
      const record_timestamp =
        record.synced_at || record.updated_at || record.created_at || "";
      return record_timestamp > latest ? record_timestamp : latest;
    }, "");
    return {
      table_name: args.table_name,
      record_count: records.length,
      latest_timestamp,
      records: records.map((record: any) => strip_convex_fields(record)),
    };
  },
});

export const check_auth = query({
  args: {},
  handler: async (ctx) => ({
    authenticated: (await ctx.auth.getUserIdentity()) !== null,
  }),
});
