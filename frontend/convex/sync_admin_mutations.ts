import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import {
  build_scope_filter,
  require_auth,
  require_permission,
} from "./lib/auth_middleware";
import { SecurityEventType } from "./lib/security_event_types";
import {
  get_entity_type_for_table,
  validate_table_name,
} from "./lib/sync_validation";
import { DEMO_DATA_TABLE_NAMES } from "./sync_demo_tables";

export const update_sync_metadata = mutation({
  args: {
    table_name: v.string(),
    sync_status: v.string(),
    records_synced: v.number(),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) return { success: false, error: "Access denied" };
    const data = {
      table_name: args.table_name,
      last_sync_at: new Date().toISOString(),
      sync_status: args.sync_status,
      records_synced: args.records_synced,
      error_message: args.error_message,
    };
    const existing = await ctx.db
      .query("sync_metadata")
      .withIndex("by_table", (q) => q.eq("table_name", args.table_name))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return { success: true, action: "updated" };
    }
    await ctx.db.insert("sync_metadata", data);
    return { success: true, action: "created" };
  },
});

export const clear_table = mutation({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return {
        success: false,
        error: table_validation.error,
        deleted_count: 0,
      };
    const entity_type = get_entity_type_for_table(args.table_name);
    const perm_result = await require_permission(ctx, entity_type, "delete");
    if (!perm_result.success) {
      await ctx.scheduler.runAfter(
        0,
        internal.security_audit.log_security_event,
        {
          event_type: SecurityEventType.ACCESS_DENIED,
          entity_type,
          user_email: undefined,
          details: `Unauthorized clear_table attempt on ${args.table_name}`,
        },
      );
      return { success: false, error: perm_result.error, deleted_count: 0 };
    }
    const all_records = await ctx.db.query(args.table_name as any).collect();
    const scope_filter = build_scope_filter(perm_result.data, entity_type);
    const scope_keys = Object.keys(scope_filter);
    const scoped_records =
      scope_keys.length === 0
        ? all_records
        : all_records.filter((record: any) =>
            scope_keys.every((key) => record[key] === scope_filter[key]),
          );
    for (const record of scoped_records) await ctx.db.delete(record._id);
    await ctx.scheduler.runAfter(
      0,
      internal.security_audit.log_security_event,
      {
        event_type: SecurityEventType.SYNC_MUTATION,
        entity_type,
        user_email: perm_result.data.email,
        organization_id: perm_result.data.organization_id,
        details: `clear_table executed on ${args.table_name}: ${scoped_records.length} records deleted (scoped from ${all_records.length} total)`,
      },
    );
    return { success: true, deleted_count: scoped_records.length };
  },
});

export const clear_all_demo_data = mutation({
  args: {},
  handler: async (ctx) => {
    const perm_result = await require_permission(ctx, "organization", "delete");
    if (!perm_result.success) {
      await ctx.scheduler.runAfter(
        0,
        internal.security_audit.log_security_event,
        {
          event_type: SecurityEventType.ACCESS_DENIED,
          entity_type: "organization",
          details: "Unauthorized clear_all_demo_data attempt",
        },
      );
      return { success: false, error: perm_result.error, deleted_count: 0 };
    }
    let total_deleted = 0;
    for (const table_name of DEMO_DATA_TABLE_NAMES) {
      try {
        const records = await ctx.db.query(table_name as any).collect();
        for (const record of records) {
          await ctx.db.delete(record._id);
          total_deleted++;
        }
      } catch (error) {
        console.warn("[clear_all_demo_data] Skipping table", {
          event: "demo_data_clear_table_skipped",
          table_name,
          error: String(error),
        });
      }
    }
    await ctx.scheduler.runAfter(
      0,
      internal.security_audit.log_security_event,
      {
        event_type: SecurityEventType.SYNC_MUTATION,
        entity_type: "organization",
        user_email: perm_result.data.email,
        organization_id: perm_result.data.organization_id,
        details: `clear_all_demo_data executed: ${total_deleted} records deleted`,
      },
    );
    console.log("[clear_all_demo_data] Done", {
      event: "demo_data_cleared",
      total_deleted,
      user_email: perm_result.data.email,
    });
    return { success: true, deleted_count: total_deleted };
  },
});
