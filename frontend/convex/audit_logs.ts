import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { try_auth, build_scope_filter } from "./lib/auth_middleware";

export const AUDIT_LOG_RETENTION_DAYS = 60;
export const AUDIT_LOG_SYNC_DAYS = 2;
export const AUDIT_LOG_PAGE_SIZE = 50;
export const CLEANUP_BATCH_SIZE = 100;

export const search_audit_logs = query({
  args: {
    entity_type: v.optional(v.string()),
    entity_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    action: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    from_date: v.optional(v.string()),
    to_date: v.optional(v.string()),
    page_number: v.optional(v.number()),
    page_size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      entity_type,
      entity_id,
      user_id,
      action,
      organization_id,
      from_date,
      to_date,
      page_number = 1,
      page_size = AUDIT_LOG_PAGE_SIZE,
    } = args;

    const user = await try_auth(ctx);

    let all_logs = await ctx.db.query("audit_logs").collect();

    if (user) {
      const scope_filter = build_scope_filter(user, "auditlog");
      if (scope_filter.organization_id) {
        all_logs = all_logs.filter(
          (log) => log.organization_id === scope_filter.organization_id,
        );
      }
    }

    let filtered_logs = all_logs;

    if (entity_type) {
      filtered_logs = filtered_logs.filter(
        (log) => log.entity_type === entity_type,
      );
    }

    if (entity_id) {
      filtered_logs = filtered_logs.filter(
        (log) => log.entity_id === entity_id,
      );
    }

    if (user_id) {
      filtered_logs = filtered_logs.filter((log) => log.user_id === user_id);
    }

    if (action) {
      filtered_logs = filtered_logs.filter((log) => log.action === action);
    }

    if (organization_id) {
      filtered_logs = filtered_logs.filter(
        (log) => log.organization_id === organization_id,
      );
    }

    if (from_date) {
      filtered_logs = filtered_logs.filter((log) => {
        const log_date = log.timestamp || log.created_at;
        return log_date && log_date >= from_date;
      });
    }

    if (to_date) {
      filtered_logs = filtered_logs.filter((log) => {
        const log_date = log.timestamp || log.created_at;
        return log_date && log_date <= to_date;
      });
    }

    filtered_logs.sort((a, b) => {
      const date_a = a.timestamp || a.created_at || "";
      const date_b = b.timestamp || b.created_at || "";
      return date_b.localeCompare(date_a);
    });

    const total_count = filtered_logs.length;
    const effective_page_size = Math.min(page_size, AUDIT_LOG_PAGE_SIZE);
    const start_index = (page_number - 1) * effective_page_size;
    const paginated_logs = filtered_logs.slice(
      start_index,
      start_index + effective_page_size,
    );

    return {
      success: true,
      data: paginated_logs,
      total_count,
      page_number,
      page_size: effective_page_size,
      total_pages: Math.ceil(total_count / effective_page_size),
    };
  },
});

export const get_recent_audit_logs = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || AUDIT_LOG_SYNC_DAYS;
    const cutoff_date = new Date();
    cutoff_date.setDate(cutoff_date.getDate() - days);
    const cutoff_timestamp = cutoff_date.toISOString();

    const user = await try_auth(ctx);

    let all_logs = await ctx.db.query("audit_logs").collect();

    if (user) {
      const scope_filter = build_scope_filter(user, "auditlog");
      if (scope_filter.organization_id) {
        all_logs = all_logs.filter(
          (log) => log.organization_id === scope_filter.organization_id,
        );
      }
    }

    const recent_logs = all_logs.filter((log) => {
      const log_date = log.timestamp || log.created_at || log.synced_at;
      return log_date && log_date >= cutoff_timestamp;
    });

    return recent_logs;
  },
});

export const delete_old_audit_logs_batch = internalMutation({
  args: {
    retention_days: v.optional(v.number()),
    batch_size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const retention_days = args.retention_days || AUDIT_LOG_RETENTION_DAYS;
    const batch_size = args.batch_size || CLEANUP_BATCH_SIZE;

    const cutoff_date = new Date();
    cutoff_date.setDate(cutoff_date.getDate() - retention_days);
    const cutoff_timestamp = cutoff_date.toISOString();

    const all_logs = await ctx.db.query("audit_logs").collect();

    const old_logs = all_logs.filter((log) => {
      const log_date = log.timestamp || log.created_at || log.synced_at;
      return log_date && log_date < cutoff_timestamp;
    });

    const logs_to_delete = old_logs.slice(0, batch_size);
    let deleted_count = 0;

    for (const log of logs_to_delete) {
      await ctx.db.delete(log._id);
      deleted_count++;
    }

    const remaining_count = old_logs.length - deleted_count;

    console.log(
      `[AuditLogCleanup] Deleted ${deleted_count} logs older than ${retention_days} days. Remaining old logs: ${remaining_count}`,
    );

    return {
      deleted_count,
      remaining_count,
      has_more: remaining_count > 0,
    };
  },
});
