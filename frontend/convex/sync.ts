import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsert_record = mutation({
  args: {
    table_name: v.string(),
    local_id: v.string(),
    data: v.any(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const { table_name, local_id, data, version } = args;
    const synced_at = new Date().toISOString();

    const table = ctx.db.query(table_name as any);
    const existing = await table
      .withIndex("by_local_id", (q) => q.eq("local_id", local_id))
      .first();

    const record_data = {
      ...data,
      local_id,
      synced_at,
      version,
    };

    if (existing) {
      if (existing.version >= version) {
        return { success: true, action: "skipped", reason: "server_newer" };
      }
      await ctx.db.patch(existing._id, record_data);
      return { success: true, action: "updated", id: existing._id };
    }

    const id = await ctx.db.insert(table_name as any, record_data);
    return { success: true, action: "created", id };
  },
});

export const get_changes_since = query({
  args: {
    table_name: v.string(),
    since_timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const { table_name, since_timestamp } = args;
    const table = ctx.db.query(table_name as any);
    const all_records = await table.collect();

    return all_records.filter((record: any) => {
      const synced_at =
        record.synced_at || record.updated_at || record.created_at;
      return synced_at > since_timestamp;
    });
  },
});

export const delete_record = mutation({
  args: {
    table_name: v.string(),
    local_id: v.string(),
  },
  handler: async (ctx, args) => {
    const { table_name, local_id } = args;
    const table = ctx.db.query(table_name as any);
    const existing = await table
      .withIndex("by_local_id", (q) => q.eq("local_id", local_id))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, action: "deleted" };
    }

    return { success: true, action: "not_found" };
  },
});

export const batch_upsert = mutation({
  args: {
    table_name: v.string(),
    records: v.array(
      v.object({
        local_id: v.string(),
        data: v.any(),
        version: v.number(),
      }),
    ),
    detect_conflicts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { table_name, records, detect_conflicts = false } = args;
    const synced_at = new Date().toISOString();
    const results: Array<{
      local_id: string;
      success: boolean;
      action: string;
    }> = [];
    const conflicts: Array<{
      local_id: string;
      local_data: Record<string, unknown>;
      local_version: number;
      remote_data: Record<string, unknown>;
      remote_version: number;
      remote_updated_at: string;
      remote_updated_by: string | null;
    }> = [];

    for (const record of records) {
      const table = ctx.db.query(table_name as any);
      const existing = await table
        .withIndex("by_local_id", (q) => q.eq("local_id", record.local_id))
        .first();

      const record_data = {
        ...record.data,
        local_id: record.local_id,
        synced_at,
        version: record.version,
      };

      if (existing) {
        if (existing.version >= record.version) {
          if (
            detect_conflicts &&
            has_meaningful_changes(record.data, existing)
          ) {
            conflicts.push({
              local_id: record.local_id,
              local_data: record.data,
              local_version: record.version,
              remote_data: strip_convex_fields(existing),
              remote_version: existing.version,
              remote_updated_at:
                existing.updated_at || existing.synced_at || "",
              remote_updated_by: existing.updated_by || null,
            });
            results.push({
              local_id: record.local_id,
              success: true,
              action: "conflict_detected",
            });
            continue;
          }
          results.push({
            local_id: record.local_id,
            success: true,
            action: "skipped",
          });
          continue;
        }
        await ctx.db.patch(existing._id, record_data);
        results.push({
          local_id: record.local_id,
          success: true,
          action: "updated",
        });
      } else {
        await ctx.db.insert(table_name as any, record_data);
        results.push({
          local_id: record.local_id,
          success: true,
          action: "created",
        });
      }
    }

    return {
      success: true,
      results,
      has_conflicts: conflicts.length > 0,
      conflicts,
    };
  },
});

function has_meaningful_changes(
  local_data: Record<string, unknown>,
  remote_data: Record<string, unknown>,
): boolean {
  const excluded_fields = new Set([
    "id",
    "local_id",
    "_id",
    "_creationTime",
    "created_at",
    "updated_at",
    "synced_at",
    "version",
  ]);

  for (const key of Object.keys(local_data)) {
    if (excluded_fields.has(key)) continue;

    const local_value = local_data[key];
    const remote_value = remote_data[key];

    if (!values_equal(local_value, remote_value)) {
      return true;
    }
  }
  return false;
}

function values_equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null && b === undefined) return true;
  if (a === undefined && b === null) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => values_equal(val, b[idx]));
  }

  if (typeof a === "object" && a !== null && b !== null) {
    const a_obj = a as Record<string, unknown>;
    const b_obj = b as Record<string, unknown>;
    const a_keys = Object.keys(a_obj);
    const b_keys = Object.keys(b_obj);
    if (a_keys.length !== b_keys.length) return false;
    return a_keys.every((key) => values_equal(a_obj[key], b_obj[key]));
  }

  return false;
}

function strip_convex_fields(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key !== "_id" && key !== "_creationTime") {
      result[key] = value;
    }
  }
  return result;
}

export const get_all_records = query({
  args: {
    table_name: v.string(),
  },
  handler: async (ctx, args) => {
    const { table_name } = args;
    const table = ctx.db.query(table_name as any);
    return await table.collect();
  },
});

export const update_sync_metadata = mutation({
  args: {
    table_name: v.string(),
    sync_status: v.string(),
    records_synced: v.number(),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { table_name, sync_status, records_synced, error_message } = args;
    const last_sync_at = new Date().toISOString();

    const existing = await ctx.db
      .query("sync_metadata")
      .withIndex("by_table", (q) => q.eq("table_name", table_name))
      .first();

    const data = {
      table_name,
      last_sync_at,
      sync_status,
      records_synced,
      error_message,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return { success: true, action: "updated" };
    }

    await ctx.db.insert("sync_metadata", data);
    return { success: true, action: "created" };
  },
});

export const get_sync_metadata = query({
  args: {
    table_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.table_name) {
      return await ctx.db
        .query("sync_metadata")
        .withIndex("by_table", (q) => q.eq("table_name", args.table_name!))
        .first();
    }
    return await ctx.db.query("sync_metadata").collect();
  },
});

export const subscribe_to_table_changes = query({
  args: {
    table_name: v.string(),
  },
  handler: async (ctx, args) => {
    const { table_name } = args;
    const table = ctx.db.query(table_name as any);
    const records = await table.collect();

    const latest_timestamp = records.reduce((latest: string, record: any) => {
      const record_timestamp =
        record.synced_at || record.updated_at || record.created_at || "";
      return record_timestamp > latest ? record_timestamp : latest;
    }, "");

    return {
      table_name,
      record_count: records.length,
      latest_timestamp,
      records: records.map((r: any) => strip_convex_fields(r)),
    };
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
    const {
      table_name,
      local_id,
      resolved_data,
      new_version,
      resolution_action,
      resolved_by,
    } = args;
    const synced_at = new Date().toISOString();

    const table = ctx.db.query(table_name as any);
    const existing = await table
      .withIndex("by_local_id", (q) => q.eq("local_id", local_id))
      .first();

    const record_data = {
      ...resolved_data,
      local_id,
      synced_at,
      version: new_version,
      conflict_resolved_at: synced_at,
      conflict_resolution_action: resolution_action,
      conflict_resolved_by: resolved_by || null,
    };

    if (existing) {
      await ctx.db.patch(existing._id, record_data);
      return {
        success: true,
        action: "conflict_resolved",
        resolution: resolution_action,
        id: existing._id,
      };
    }

    const id = await ctx.db.insert(table_name as any, record_data);
    return {
      success: true,
      action: "created_after_conflict",
      resolution: resolution_action,
      id,
    };
  },
});
