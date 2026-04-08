import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import type { UserRole } from "./lib/auth_middleware";
import {
  check_permission,
  get_entity_data_category,
  require_auth,
} from "./lib/auth_middleware";
import { SecurityEventType } from "./lib/security_event_types";
import {
  get_entity_type_for_table,
  validate_record_organization_ownership,
  validate_table_name,
} from "./lib/sync_validation";
import { validate_record_url_fields } from "./lib/url_validation";
import {
  has_meaningful_changes,
  strip_convex_fields,
} from "./sync_record_helpers";

export const batch_upsert = mutation({
  args: {
    table_name: v.string(),
    records: v.array(
      v.object({ local_id: v.string(), data: v.any(), version: v.number() }),
    ),
    detect_conflicts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { table_name, records, detect_conflicts = false } = args;
    const MAX_BATCH_SIZE = 50;
    if (records.length > MAX_BATCH_SIZE)
      return {
        success: false,
        error: `Batch size ${records.length} exceeds maximum of ${MAX_BATCH_SIZE}`,
        results: [],
        has_conflicts: false,
        conflicts: [],
      };
    const table_validation = validate_table_name(table_name);
    if (!table_validation.success)
      return {
        success: false,
        error: table_validation.error,
        results: [],
        has_conflicts: false,
        conflicts: [],
      };
    const entity_type = get_entity_type_for_table(table_name);
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) {
      await ctx.scheduler.runAfter(
        0,
        internal.security_audit.log_security_event,
        {
          event_type: SecurityEventType.AUTH_FAILURE,
          entity_type,
          details: `Unauthenticated batch_upsert attempt on ${table_name} with ${records.length} records`,
        },
      );
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
    if (
      !check_permission(user_role, data_category, "create") &&
      !check_permission(user_role, data_category, "update")
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.security_audit.log_security_event,
        {
          event_type: SecurityEventType.ACCESS_DENIED,
          entity_type,
          user_email: auth_result.data.email,
          organization_id: auth_result.data.organization_id,
          details: `Role "${user_role}" denied create/update on "${entity_type}" (${records.length} records)`,
        },
      );
      return {
        success: false,
        error: `Role "${user_role}" does not have create or update permission for "${entity_type}"`,
        results: [],
        has_conflicts: false,
        conflicts: [],
      };
    }
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
      const existing = await ctx.db
        .query(table_name as any)
        .withIndex("by_local_id", (q) => q.eq("local_id", record.local_id))
        .first();
      const sanitized_data = { ...record.data } as Record<string, unknown>;
      delete sanitized_data._id;
      delete sanitized_data._creationTime;
      const url_validation = validate_record_url_fields(sanitized_data);
      if (!url_validation.is_valid) {
        results.push({
          local_id: record.local_id,
          success: false,
          action: "rejected_invalid_url",
        });
        continue;
      }
      const ownership_check = validate_record_organization_ownership(
        sanitized_data,
        auth_result.data,
        table_name,
      );
      if (!ownership_check.success) {
        results.push({
          local_id: record.local_id,
          success: false,
          action: "rejected_wrong_organization",
        });
        continue;
      }
      if (table_name === "system_users") {
        if (!sanitized_data.email) {
          results.push({
            local_id: record.local_id,
            success: false,
            action: "skipped_no_email",
          });
          continue;
        }
        if (!sanitized_data.role) sanitized_data.role = "player";
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
        continue;
      }
      await ctx.db.insert(table_name as any, record_data);
      results.push({
        local_id: record.local_id,
        success: true,
        action: "created",
      });
    }
    return {
      success: true,
      results,
      has_conflicts: conflicts.length > 0,
      conflicts,
    };
  },
});
