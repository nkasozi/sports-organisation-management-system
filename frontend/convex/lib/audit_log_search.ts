import {
  ConvexErrorCode,
  type ConvexFailure,
  log_convex_failure,
} from "./convex_errors";

interface AuditLogRow {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  action?: string;
  organization_id?: string;
  timestamp?: string;
  created_at?: string;
}

interface AuditLogSearchCriteria {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  action?: string;
  organization_id?: string;
  from_date?: string;
  to_date?: string;
}

type AuditLogExactField =
  | "entity_type"
  | "entity_id"
  | "user_id"
  | "action"
  | "organization_id";

const EXACT_MATCH_FIELDS: readonly AuditLogExactField[] = [
  "entity_type",
  "entity_id",
  "user_id",
  "action",
  "organization_id",
];
const MISSING_DATE = "";
const FIRST_PAGE_NUMBER = 1;
const MINIMUM_PAGE_SIZE = 1;
const INVALID_PAGE_REQUEST_EVENT = "audit_log_search_invalid_page";
const InvalidPageField = {
  PAGE_NUMBER: "page_number",
  PAGE_SIZE: "page_size",
} as const;

interface AuditPageRequest {
  page_number?: number;
  page_size?: number;
}

interface AuditPage {
  page_number: number;
  page_size: number;
}

type AuditPageResolution = { success: true; data: AuditPage } | ConvexFailure;

function is_positive_integer(value: number): boolean {
  return Number.isInteger(value) && value >= MINIMUM_PAGE_SIZE;
}

export function resolve_audit_page_request(
  requested_page: AuditPageRequest,
  maximum_page_size: number,
): AuditPageResolution {
  const page_number = requested_page.page_number ?? FIRST_PAGE_NUMBER;
  const page_size = requested_page.page_size ?? maximum_page_size;
  if (!is_positive_integer(page_number))
    return log_convex_failure(ConvexErrorCode.INVALID_REQUEST, {
      event: INVALID_PAGE_REQUEST_EVENT,
      invalid_field: InvalidPageField.PAGE_NUMBER,
      page_number,
    });
  if (!is_positive_integer(page_size))
    return log_convex_failure(ConvexErrorCode.INVALID_REQUEST, {
      event: INVALID_PAGE_REQUEST_EVENT,
      invalid_field: InvalidPageField.PAGE_SIZE,
      page_size,
    });
  return {
    success: true,
    data: { page_number, page_size: Math.min(page_size, maximum_page_size) },
  };
}

function read_log_date(log: AuditLogRow): string {
  return log.timestamp || log.created_at || MISSING_DATE;
}

function matches_exact_criteria(
  log: AuditLogRow,
  criteria: AuditLogSearchCriteria,
): boolean {
  return EXACT_MATCH_FIELDS.every(
    (field_name) =>
      !criteria[field_name] || log[field_name] === criteria[field_name],
  );
}

function matches_date_range(
  log: AuditLogRow,
  criteria: AuditLogSearchCriteria,
): boolean {
  const log_date = read_log_date(log);
  const after_start =
    !criteria.from_date ||
    (Boolean(log_date) && log_date >= criteria.from_date);
  const before_end =
    !criteria.to_date || (Boolean(log_date) && log_date <= criteria.to_date);
  return after_start && before_end;
}

export function filter_audit_logs<TLog extends AuditLogRow>(
  logs: TLog[],
  criteria: AuditLogSearchCriteria,
): TLog[] {
  return logs.filter(
    (log) =>
      matches_exact_criteria(log, criteria) &&
      matches_date_range(log, criteria),
  );
}

export function sort_audit_logs_newest_first<TLog extends AuditLogRow>(
  logs: TLog[],
): TLog[] {
  return [...logs].sort((left, right) =>
    read_log_date(right).localeCompare(read_log_date(left)),
  );
}

interface AuditSearchPage<TLog> {
  success: true;
  data: TLog[];
  total_count: number;
  page_number: number;
  page_size: number;
  total_pages: number;
}

export function paginate_audit_logs<TLog>(
  logs: TLog[],
  page: AuditPage,
): AuditSearchPage<TLog> {
  const start_index = (page.page_number - 1) * page.page_size;
  return {
    success: true,
    data: logs.slice(start_index, start_index + page.page_size),
    total_count: logs.length,
    page_number: page.page_number,
    page_size: page.page_size,
    total_pages: Math.ceil(logs.length / page.page_size),
  };
}

export function build_empty_audit_search_page(
  failure: ConvexFailure,
  page_size: number,
): ConvexFailure & {
  data: never[];
  total_count: number;
  page_number: number;
  page_size: number;
  total_pages: number;
} {
  return {
    ...failure,
    data: [],
    total_count: 0,
    page_number: 1,
    page_size,
    total_pages: 0,
  };
}
