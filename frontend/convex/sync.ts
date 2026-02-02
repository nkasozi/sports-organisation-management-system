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
  },
  handler: async (ctx, args) => {
    const { table_name, records } = args;
    const synced_at = new Date().toISOString();
    const results: Array<{
      local_id: string;
      success: boolean;
      action: string;
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

    return { success: true, results };
  },
});

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
