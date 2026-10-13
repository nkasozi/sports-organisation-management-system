import type {
  AuditAction,
  AuditLog,
  FieldChange,
} from "$lib/core/entities/AuditLog";
import type { AuditLogFilter } from "$lib/core/interfaces/ports";

import { get_sync_manager } from "./convexSyncService";

export const AUDIT_LOG_PAGE_SIZE = 50;

interface AuditLogSearchResult {
  success: boolean;
  data: AuditLog[];
  total_count: number;
  page_number: number;
  page_size: number;
  total_pages: number;
  error_message?: string;
}

interface AuditLogSearchOptions {
  page_number?: number;
  page_size?: number;
}

function is_convex_available(): boolean {
  const manager = get_sync_manager();
  return manager.is_configured();
}

const DEFAULT_AUDIT_LOG_PAGE_NUMBER = 1;
const SEARCH_AUDIT_LOGS_QUERY_NAME = "audit_logs:search_audit_logs";
const CONVEX_CLIENT_NOT_CONFIGURED_MESSAGE = "Convex client not configured";

const AUDIT_LOG_FILTER_QUERY_KEYS = [
  "entity_type",
  "entity_id",
  "user_id",
  "action",
  "organization_id",
  "from_date",
  "to_date",
] as const satisfies ReadonlyArray<keyof AuditLogFilter>;

interface ConvexAuditLogSearchResponse {
  success: boolean;
  data: AuditLog[];
  total_count: number;
  page_number: number;
  page_size: number;
  total_pages: number;
}

function build_unconfigured_search_result(): AuditLogSearchResult {
  return {
    success: false,
    data: [],
    total_count: 0,
    page_number: DEFAULT_AUDIT_LOG_PAGE_NUMBER,
    page_size: AUDIT_LOG_PAGE_SIZE,
    total_pages: 0,
    error_message: CONVEX_CLIENT_NOT_CONFIGURED_MESSAGE,
  };
}

function build_audit_log_query_args(
  filter: AuditLogFilter,
  options: AuditLogSearchOptions,
): Record<string, unknown> {
  const {
    page_number = DEFAULT_AUDIT_LOG_PAGE_NUMBER,
    page_size = AUDIT_LOG_PAGE_SIZE,
  } = options;
  const query_args: Record<string, unknown> = {
    page_number,
    page_size: Math.min(page_size, AUDIT_LOG_PAGE_SIZE),
  };

  for (const filter_key of AUDIT_LOG_FILTER_QUERY_KEYS) {
    if (filter[filter_key]) query_args[filter_key] = filter[filter_key];
  }

  return query_args;
}

export async function search_audit_logs_from_convex(
  filter: AuditLogFilter,
  options: AuditLogSearchOptions = {},
): Promise<AuditLogSearchResult> {
  const client_result = get_sync_manager().get_convex_client();

  if (!client_result.success) {
    return build_unconfigured_search_result();
  }

  const result = (await client_result.data.query(
    SEARCH_AUDIT_LOGS_QUERY_NAME as never,
    build_audit_log_query_args(filter, options),
  )) as ConvexAuditLogSearchResponse;

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
  } as AuditLog;
}

async function get_recent_audit_logs_from_convex(
  days: number = 2,
): Promise<AuditLog[]> {
  const manager = get_sync_manager();
  const client_result = manager.get_convex_client();

  if (!client_result.success) {
    return [];
  }

  const client = client_result.data;

  const result = (await client.query(
    "audit_logs:get_recent_audit_logs" as never,
    { days },
  )) as unknown[];

  return result.map(transform_convex_audit_log);
}

export { is_convex_available };
