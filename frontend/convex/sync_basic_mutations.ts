import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { require_permission } from "./lib/auth_middleware";
import { SecurityEventType } from "./lib/security_event_types";
import {
  get_entity_type_for_table,
  validate_record_organization_ownership,
  validate_table_name,
} from "./lib/sync_validation";
import { validate_record_url_fields } from "./lib/url_validation";

export const upsert_record = mutation({
  args: {
    table_name: v.string(),
    local_id: v.string(),
    data: v.any(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const { table_name, local_id, data, version } = args;
    const table_validation = validate_table_name(table_name);
    if (!table_validation.success)
      return { success: false, error: table_validation.error };
    const synced_at = new Date().toISOString();
    const entity_type = get_entity_type_for_table(table_name);
    const existing = await ctx.db
      .query(table_name as any)
      .withIndex("by_local_id", (q) => q.eq("local_id", local_id))
      .first();
    const action = existing ? "update" : "create";
    const perm_result = await require_permission(ctx, entity_type, action);
    if (!perm_result.success) {
      await ctx.scheduler.runAfter(
        0,
        internal.security_audit.log_security_event,
        {
          event_type: SecurityEventType.ACCESS_DENIED,
          entity_type,
          entity_id: local_id,
          details: `Permission denied for ${action} on ${table_name}`,
        },
      );
      return { success: false, error: perm_result.error };
    }
    const ownership_result = validate_record_organization_ownership(
      data,
      perm_result.data,
      table_name,
    );
    if (!ownership_result.success) {
      await ctx.scheduler.runAfter(
        0,
        internal.security_audit.log_security_event,
        {
          event_type: SecurityEventType.ORG_SCOPE_VIOLATION,
          entity_type,
          entity_id: local_id,
          user_email: perm_result.data.email,
          organization_id: perm_result.data.organization_id,
          details: `Org scope violation on ${table_name}`,
        },
      );
      return { success: false, error: ownership_result.error };
    }
    const record_data = { ...data, local_id, synced_at, version } as Record<
      string,
      unknown
    >;
    delete record_data._id;
    delete record_data._creationTime;
    const url_validation = validate_record_url_fields(record_data);
    if (!url_validation.is_valid)
      return { success: false, error: url_validation.error };
    if (existing) {
      if (existing.version >= version)
        return { success: true, action: "skipped", reason: "server_newer" };
      await ctx.db.patch(existing._id, record_data);
      return { success: true, action: "updated", id: existing._id };
    }
    return {
      success: true,
      action: "created",
      id: await ctx.db.insert(table_name as any, record_data),
    };
  },
});

export const delete_record = mutation({
  args: { table_name: v.string(), local_id: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return { success: false, error: table_validation.error };
    const perm_result = await require_permission(
      ctx,
      get_entity_type_for_table(args.table_name),
      "delete",
    );
    if (!perm_result.success)
      return { success: false, error: perm_result.error };
    const existing = await ctx.db
      .query(args.table_name as any)
      .withIndex("by_local_id", (q) => q.eq("local_id", args.local_id))
      .first();
    if (!existing) return { success: true, action: "not_found" };
    await ctx.db.delete(existing._id);
    return { success: true, action: "deleted" };
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
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return { success: false, error: table_validation.error };
    const entity_type = get_entity_type_for_table(args.table_name);
    const perm_result = await require_permission(ctx, entity_type, "update");
    if (!perm_result.success)
      return { success: false, error: perm_result.error };
    const synced_at = new Date().toISOString();
    const existing = await ctx.db
      .query(args.table_name as any)
      .withIndex("by_local_id", (q) => q.eq("local_id", args.local_id))
      .first();
    const record_data = {
      ...args.resolved_data,
      local_id: args.local_id,
      synced_at,
      version: args.new_version,
      conflict_resolved_at: synced_at,
      conflict_resolution_action: args.resolution_action,
      ...(args.resolved_by ? { conflict_resolved_by: args.resolved_by } : {}),
    };
    if (existing) {
      await ctx.db.patch(existing._id, record_data);
      return {
        success: true,
        action: "conflict_resolved",
        resolution: args.resolution_action,
        id: existing._id,
      };
    }
    return {
      success: true,
      action: "created_after_conflict",
      resolution: args.resolution_action,
      id: await ctx.db.insert(args.table_name as any, record_data),
    };
  },
});
