import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  is_number_value,
  is_record_value,
  is_string_value,
} from "$lib/infrastructure/utils/runtimeTypeGuards";

import type { RemoteApplyDependencies } from "./syncRemoteApply";
import type { ConvexClient, TableName } from "./syncTypes";

export const SYNC_PULL_PAGE_SIZE = 100;
const CHANGES_PAGE_QUERY_NAME = "sync:get_changes_page";
const INVALID_PAGE_RESPONSE_ERROR = "Invalid change page response";

export const ChangePageStatus = {
  CHANGES: "changes",
  CURSOR_EXPIRED: "cursor_expired",
  BACKFILL_IN_PROGRESS: "backfill_in_progress",
} as const;

export interface ChangePageContent {
  records: Array<Record<string, unknown>>;
  tombstones: Array<{ local_id: string; version: number }>;
  next_cursor: number;
  has_more: boolean;
}

export type ChangePageResponse =
  | { status: typeof ChangePageStatus.CHANGES; page: ChangePageContent }
  | { status: typeof ChangePageStatus.CURSOR_EXPIRED }
  | {
      status: typeof ChangePageStatus.BACKFILL_IN_PROGRESS;
      retry_after_milliseconds: number;
    };

export interface PullTableChangesCommand extends RemoteApplyDependencies {
  convex_client: ConvexClient;
  table_name: TableName;
  correlation_id: string;
}

function is_change_page_content(page: Record<string, unknown>): boolean {
  return (
    Array.isArray(page.records) &&
    Array.isArray(page.tombstones) &&
    is_number_value(page.next_cursor) &&
    typeof page.has_more === typeof true
  );
}

function parse_backfill_page(
  page: Record<string, unknown>,
): Result<ChangePageResponse> {
  const retry_after = page.retry_after_milliseconds;
  return is_number_value(retry_after) && retry_after > 0
    ? create_success_result({
        status: ChangePageStatus.BACKFILL_IN_PROGRESS,
        retry_after_milliseconds: retry_after,
      })
    : create_failure_result(INVALID_PAGE_RESPONSE_ERROR);
}

function parse_successful_page(
  page: Record<string, unknown>,
): Result<ChangePageResponse> {
  switch (page.status) {
    case ChangePageStatus.CURSOR_EXPIRED:
      return create_success_result({ status: ChangePageStatus.CURSOR_EXPIRED });
    case ChangePageStatus.BACKFILL_IN_PROGRESS:
      return parse_backfill_page(page);
    case ChangePageStatus.CHANGES:
      return is_change_page_content(page)
        ? create_success_result({
            status: ChangePageStatus.CHANGES,
            page: page as unknown as ChangePageContent,
          })
        : create_failure_result(INVALID_PAGE_RESPONSE_ERROR);
    default:
      return create_failure_result(INVALID_PAGE_RESPONSE_ERROR);
  }
}

function parse_change_page(response: unknown): Result<ChangePageResponse> {
  if (!is_record_value(response))
    return create_failure_result(INVALID_PAGE_RESPONSE_ERROR);
  const page = response;
  if (page.success === true) return parse_successful_page(page);
  return create_failure_result(
    is_string_value(page.error) && page.error
      ? page.error
      : INVALID_PAGE_RESPONSE_ERROR,
  );
}

export async function fetch_change_page(
  command: PullTableChangesCommand,
  after_sequence: number,
): AsyncResult<ChangePageResponse> {
  try {
    return parse_change_page(
      await command.convex_client.query(CHANGES_PAGE_QUERY_NAME, {
        table_name: command.table_name,
        after_sequence,
        page_size: SYNC_PULL_PAGE_SIZE,
      }),
    );
  } catch (error) {
    console.error("[Sync:Pull] Change page query failed", {
      event: "sync_pull_page_query_failed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      after_sequence,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}
