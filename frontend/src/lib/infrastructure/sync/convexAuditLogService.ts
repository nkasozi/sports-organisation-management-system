import { get_sync_manager } from "./convexSyncService";
import type {
  AuditLog,
  AuditAction,
  FieldChange,
} from "$lib/core/entities/AuditLog";
import type { AuditLogFilter } from "$lib/core/interfaces/ports";

export const AUDIT_LOG_PAGE_SIZE = 50;

export interface AuditLogSearchResult {
  success: boolean;
  data: AuditLog[];
  total_count: number;
  page_number: number;
  page_size: number;
  total_pages: number;
  error_message?: string;
}

export interface AuditLogSearchOptions {
  page_number?: number;
  page_size?: number;
}

function is_convex_available(): boolean {
  const manager = get_sync_manager();
  return manager.is_configured();
}

export async function search_audit_logs_from_convex(
  filter: AuditLogFilter,
  options: AuditLogSearchOptions = {},
): Promise<AuditLogSearchResult> {
  const manager = get_sync_manager();
  const client = manager.get_convex_client();

  if (!client) {
    return {
      success: false,
      data: [],
      total_count: 0,
      page_number: 1,
      page_size: AUDIT_LOG_PAGE_SIZE,
      total_pages: 0,
      error_message: "Convex client not configured",
    };
  }

  const { page_number = 1, page_size = AUDIT_LOG_PAGE_SIZE } = options;

  const query_args: Record<string, unknown> = {
    page_number,
    page_size: Math.min(page_size, AUDIT_LOG_PAGE_SIZE),
  };

  if (filter.entity_type) query_args.entity_type = filter.entity_type;
  if (filter.entity_id) query_args.entity_id = filter.entity_id;
  if (filter.user_id) query_args.user_id = filter.user_id;
  if (filter.action) query_args.action = filter.action;
  if (filter.organization_id)
    query_args.organization_id = filter.organization_id;
  if (filter.from_date) query_args.from_date = filter.from_date;
  if (filter.to_date) query_args.to_date = filter.to_date;

  const result = (await client.query(
    "audit_logs:search_audit_logs" as never,
    query_args,
  )) as {
    success: boolean;
    data: AuditLog[];
    total_count: number;
    page_number: number;
    page_size: number;
    total_pages: number;
  };

  return {
    success: result.success,
    data: result.data.map(transform_convex_audit_log),
    total_count: result.total_count,
    page_number: result.page_number,
    page_size: result.page_size,
    total_pages: result.total_pages,
  };
}

function transform_convex_audit_log(record: unknown): AuditLog {
  const raw = record as Record<string, unknown>;
  return {
    id: (raw.local_id as string) || (raw._id as string) || "",
    action: (raw.action as AuditAction) || "create",
    entity_type: (raw.entity_type as string) || "",
    entity_id: (raw.entity_id as string) || "",
    entity_display_name: (raw.entity_display_name as string) || "",
    organization_id: (raw.organization_id as string) || "",
    user_id: (raw.user_id as string) || "",
    user_email: (raw.user_email as string) || "",
    user_display_name: (raw.user_display_name as string) || "",
    changes: (raw.changes as FieldChange[]) || [],
    timestamp: (raw.timestamp as string) || (raw.created_at as string) || "",
    ip_address: (raw.ip_address as string) || "",
    user_agent: (raw.user_agent as string) || "",
    created_at: (raw.created_at as string) || "",
    updated_at: (raw.updated_at as string) || "",
  };
}

export async function get_recent_audit_logs_from_convex(
  days: number = 2,
): Promise<AuditLog[]> {
  const manager = get_sync_manager();
  const client = manager.get_convex_client();

  if (!client) {
    return [];
  }

  const result = (await client.query(
    "audit_logs:get_recent_audit_logs" as never,
    { days },
  )) as unknown[];

  return result.map(transform_convex_audit_log);
}

export { is_convex_available };
