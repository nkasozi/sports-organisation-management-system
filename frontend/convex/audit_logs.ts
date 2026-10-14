import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, query } from "./_generated/server";
import { load_scoped_audit_logs } from "./lib/audit_log_access";
import {
  build_empty_audit_search_page,
  filter_audit_logs,
  paginate_audit_logs,
  resolve_audit_page_request,
  sort_audit_logs_newest_first,
} from "./lib/audit_log_search";

export const AUDIT_LOG_RETENTION_DAYS = 60;
export const AUDIT_LOG_SYNC_DAYS = 2;
export const AUDIT_LOG_PAGE_SIZE = 50;
export const CLEANUP_BATCH_SIZE = 100;

const AUDIT_LOGS_TABLE_NAME = "audit_logs";
const TIMESTAMP_INDEX_NAME = "by_timestamp";
const NO_EARLIEST_TIMESTAMP = "";
const IMMEDIATE_DELAY_MILLISECONDS = 0;
const MAX_AUDIT_CLEANUP_CONTINUATIONS = 1000;
const AUDIT_LOG_CLEANUP_EVENT = "audit_log_cleanup";
const MISSING_LOG_DATE = "";

type AuditLogDocument = Doc<"audit_logs">;

function read_audit_log_date(log: AuditLogDocument): string {
  return log.timestamp || log.created_at || log.synced_at || MISSING_LOG_DATE;
}

function build_cutoff_timestamp(days_ago: number): string {
  const cutoff_date = new Date();
  cutoff_date.setDate(cutoff_date.getDate() - days_ago);
  return cutoff_date.toISOString();
}

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
    const page_request = resolve_audit_page_request(args, AUDIT_LOG_PAGE_SIZE);
    if (!page_request.success)
      return build_empty_audit_search_page(page_request, AUDIT_LOG_PAGE_SIZE);
    const scoped_logs = await load_scoped_audit_logs(ctx, {
      earliest_timestamp: args.from_date ?? NO_EARLIEST_TIMESTAMP,
    });
    if (!scoped_logs.success)
      return build_empty_audit_search_page(scoped_logs, AUDIT_LOG_PAGE_SIZE);
    return paginate_audit_logs(
      sort_audit_logs_newest_first(filter_audit_logs(scoped_logs.data, args)),
      page_request.data,
    );
  },
});

export const get_recent_audit_logs = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const cutoff_timestamp = build_cutoff_timestamp(
      args.days || AUDIT_LOG_SYNC_DAYS,
    );
    const scoped_logs = await load_scoped_audit_logs(ctx, {
      earliest_timestamp: cutoff_timestamp,
    });
    if (!scoped_logs.success) return [];
    return scoped_logs.data.filter((log) => {
      const log_date = read_audit_log_date(log);
      return Boolean(log_date) && log_date >= cutoff_timestamp;
    });
  },
});

export const delete_old_audit_logs_batch = internalMutation({
  args: {
    retention_days: v.optional(v.number()),
    batch_size: v.optional(v.number()),
    continuation_count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const retention_days = args.retention_days || AUDIT_LOG_RETENTION_DAYS;
    const batch_size = args.batch_size || CLEANUP_BATCH_SIZE;
    const continuation_count = args.continuation_count ?? 0;
    const cutoff_timestamp = build_cutoff_timestamp(retention_days);
    const expired_logs = await ctx.db
      .query(AUDIT_LOGS_TABLE_NAME)
      .withIndex(TIMESTAMP_INDEX_NAME, (range) =>
        range
          .gte("timestamp", NO_EARLIEST_TIMESTAMP)
          .lt("timestamp", cutoff_timestamp),
      )
      .take(batch_size);
    for (const log of expired_logs) await ctx.db.delete(log._id);
    const has_more =
      expired_logs.length === batch_size &&
      continuation_count < MAX_AUDIT_CLEANUP_CONTINUATIONS;
    if (has_more)
      await ctx.scheduler.runAfter(
        IMMEDIATE_DELAY_MILLISECONDS,
        internal.audit_logs.delete_old_audit_logs_batch,
        {
          retention_days,
          batch_size,
          continuation_count: continuation_count + 1,
        },
      );
    console.log("[AuditLogCleanup] Batch complete", {
      event: AUDIT_LOG_CLEANUP_EVENT,
      correlation_id: `${cutoff_timestamp}#${continuation_count}`,
      deleted_count: expired_logs.length,
      retention_days,
      has_more,
    });
    return { deleted_count: expired_logs.length, has_more };
  },
});
