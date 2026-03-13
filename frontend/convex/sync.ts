import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  require_auth,
  require_permission,
  try_auth,
  build_scope_filter,
  check_permission,
  get_entity_data_category,
} from "./lib/auth_middleware";
import type { UserRole } from "./lib/auth_middleware";

export const GLOBAL_TABLES = [
  "sports",
  "genders",
  "player_positions",
  "identification_types",
  "competition_formats",
  "game_event_types",
  "team_staff_roles",
  "game_official_roles",
  "jersey_colors",
  "activity_categories",
] as const;

export function is_global_table(table_name: string): boolean {
  return GLOBAL_TABLES.includes(table_name as (typeof GLOBAL_TABLES)[number]);
}

function is_global_record(record: Record<string, unknown>): boolean {
  const org_id = record.organization_id;
  return (
    org_id === undefined || org_id === null || org_id === "*" || org_id === ""
  );
}

function get_entity_type_from_table(table_name: string): string {
  const stripped = table_name.toLowerCase().replace(/_/g, "");
  if (stripped.endsWith("ies")) {
    return stripped.slice(0, -3) + "y";
  }
  if (
    stripped.endsWith("xes") ||
    stripped.endsWith("shes") ||
    stripped.endsWith("ches")
  ) {
    return stripped.slice(0, -2);
  }
  if (stripped.endsWith("s") && !stripped.endsWith("ss")) {
    return stripped.slice(0, -1);
  }
  return stripped;
}

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

    const entity_type = get_entity_type_from_table(table_name);
    const table = ctx.db.query(table_name as any);
    const existing = await table
      .withIndex("by_local_id", (q) => q.eq("local_id", local_id))
      .first();

    const action = existing ? "update" : "create";
    const perm_result = await require_permission(ctx, entity_type, action);
    if (!perm_result.success) {
      return { success: false, error: perm_result.error };
    }

    const record_data = {
      ...data,
      local_id,
      synced_at,
      version,
    };

    // strip Convex system fields — they must not be set on patch/insert
    delete (record_data as Record<string, unknown>)._id;
    delete (record_data as Record<string, unknown>)._creationTime;

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
    const entity_type = get_entity_type_from_table(table_name);
    const user = await try_auth(ctx);
    const table = ctx.db.query(table_name as any);
    let all_records = await table.collect();

    if (user.success && !is_global_table(table_name)) {
      const scope_filter = build_scope_filter(user.data, entity_type);
      if (scope_filter.organization_id) {
        const user_org_id = scope_filter.organization_id;

        if (table_name === "organizations") {
          all_records = all_records.filter(
            (record: any) => record.local_id === user_org_id,
          );
        } else {
          all_records = all_records.filter((record: any) => {
            if (is_global_record(record)) {
              return true;
            }
            if (scope_filter.team_id && record.team_id) {
              return (
                record.organization_id === user_org_id &&
                record.team_id === scope_filter.team_id
              );
            }
            return record.organization_id === user_org_id;
          });
        }
      }
    }

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
    const entity_type = get_entity_type_from_table(table_name);

    const perm_result = await require_permission(ctx, entity_type, "delete");
    if (!perm_result.success) {
      return { success: false, error: perm_result.error };
    }

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
    const entity_type = get_entity_type_from_table(table_name);
    const synced_at = new Date().toISOString();

    const auth_result = await require_auth(ctx);
    if (!auth_result.success) {
      return {
        success: false,
        error: auth_result.error,
        results: [],
        has_conflicts: false,
        conflicts: [],
      };
    }
    const user_role = auth_result.data.role as UserRole;
    const data_category = get_entity_data_category(entity_type);
    const can_create = check_permission(user_role, data_category, "create");
    const can_update = check_permission(user_role, data_category, "update");
    if (!can_create && !can_update) {
      return {
        success: false,
        error: `Role "${user_role}" does not have create or update permission for "${entity_type}"`,
        results: [],
        has_conflicts: false,
        conflicts: [],
      };
    }

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

      const sanitized_data = { ...record.data } as Record<string, unknown>;
      delete sanitized_data._id;
      delete sanitized_data._creationTime;

      if (table_name === "system_users") {
        if (!sanitized_data.email) {
          console.warn(
            `[Sync] Skipping system_users record without email: local_id=${record.local_id}`,
          );
          results.push({
            local_id: record.local_id,
            success: false,
            action: "skipped_no_email",
          });
          continue;
        }
        if (!sanitized_data.role) {
          sanitized_data.role = "player";
        }
      }

      const record_data = {
        ...sanitized_data,
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

export const get_latest_modified_at = query({
  args: {
    table_name: v.string(),
  },
  handler: async (ctx, args) => {
    const { table_name } = args;
    const records = await ctx.db.query(table_name as any).collect();

    let latest_modified_at = "";
    let record_count = 0;

    for (const record of records) {
      record_count++;
      const timestamp =
        (record as any).updated_at ||
        (record as any).modified_at ||
        (record as any).created_at ||
        "";
      if (timestamp > latest_modified_at) {
        latest_modified_at = timestamp;
      }
    }

    return {
      table_name,
      record_count,
      latest_modified_at: latest_modified_at || null,
    };
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

    const entity_type = get_entity_type_from_table(table_name);

    const perm_result = await require_permission(ctx, entity_type, "update");
    if (!perm_result.success) {
      return { success: false, error: perm_result.error };
    }

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

export const check_auth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return { authenticated: identity !== null };
  },
});

export const clear_table = mutation({
  args: {
    table_name: v.string(),
  },
  handler: async (ctx, args) => {
    const { table_name } = args;
    const entity_type = get_entity_type_from_table(table_name);

    const perm_result = await require_permission(ctx, entity_type, "delete");
    if (!perm_result.success) {
      return {
        success: false,
        error: perm_result.error,
        deleted_count: 0,
      };
    }

    const all_records = await ctx.db.query(table_name as any).collect();
    for (const record of all_records) {
      await ctx.db.delete(record._id);
    }

    return { success: true, deleted_count: all_records.length };
  },
});

const ALL_SYNCED_TABLE_NAMES = [
  "organizations",
  "competitions",
  "teams",
  "players",
  "officials",
  "fixtures",
  "sports",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "venues",
  "jersey_colors",
  "player_positions",
  "player_profiles",
  "team_profiles",
  "profile_links",
  "calendar_tokens",
  "competition_formats",
  "competition_teams",
  "player_team_memberships",
  "fixture_details_setups",
  "fixture_lineups",
  "activities",
  "activity_categories",
  "system_users",
  "identification_types",
  "identifications",
  "qualifications",
  "game_event_types",
  "genders",
  "live_game_logs",
  "game_event_logs",
  "player_team_transfer_histories",
  "official_associated_teams",
] as const;

export const get_all_tables_latest_timestamps = query({
  args: {},
  handler: async (ctx, _args) => {
    const result: Record<
      string,
      { record_count: number; latest_modified_at: string | null }
    > = {};

    for (const table_name of ALL_SYNCED_TABLE_NAMES) {
      const records = await ctx.db.query(table_name as any).collect();

      let latest_modified_at = "";
      for (const record of records) {
        const timestamp =
          (record as any).updated_at ||
          (record as any).modified_at ||
          (record as any).created_at ||
          "";
        if (timestamp > latest_modified_at) {
          latest_modified_at = timestamp;
        }
      }

      result[table_name] = {
        record_count: records.length,
        latest_modified_at: latest_modified_at || null,
      };
    }

    return result;
  },
});
