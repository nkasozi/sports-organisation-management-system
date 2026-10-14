import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type ChangePageContent,
  ChangePageStatus,
  fetch_change_page,
  type PullTableChangesCommand,
} from "./syncChangePageFetch";
import { read_sync_cursor } from "./syncOutboxRepository";
import {
  create_backfill_pending_pull,
  create_completed_pull,
  type TablePullSummary,
} from "./syncPullTypes";
import {
  apply_remote_change_page,
  convert_server_record_to_remote_change,
  convert_tombstone_to_remote_deletion,
} from "./syncRemoteApply";
import { resync_table_from_server } from "./syncTableResync";

export { SYNC_PULL_PAGE_SIZE } from "./syncChangePageFetch";

const CURSOR_DID_NOT_ADVANCE_ERROR =
  "Change feed reported more changes without advancing the cursor";

async function apply_change_page(
  command: PullTableChangesCommand,
  page: ChangePageContent,
): AsyncResult<number> {
  try {
    const summary = await apply_remote_change_page(command, {
      table_name: command.table_name,
      records: page.records.map(convert_server_record_to_remote_change),
      deletions: page.tombstones.map(convert_tombstone_to_remote_deletion),
      next_cursor: page.next_cursor,
    });
    if (summary.deferred_local_ids.length > 0)
      console.log("[Sync:Pull] Kept unsynced local edits over remote copies", {
        event: "sync_pull_deferred_dirty_records",
        correlation_id: command.correlation_id,
        table_name: command.table_name,
        deferred_count: summary.deferred_local_ids.length,
      });
    return create_success_result(summary.applied_count);
  } catch (error) {
    console.error("[Sync:Pull] Failed to apply change page", {
      event: "sync_pull_page_apply_failed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

async function read_cursor_safely(
  command: PullTableChangesCommand,
): AsyncResult<number> {
  try {
    return create_success_result(
      await read_sync_cursor(command.database, command.table_name),
    );
  } catch (error) {
    console.error("[Sync:Pull] Failed to read the table cursor", {
      event: "sync_pull_cursor_read_failed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

function wait_for_backfill(
  command: PullTableChangesCommand,
  records_pulled: number,
  retry_after_milliseconds: number,
): TablePullSummary {
  console.warn("[Sync:Pull] Server is still backfilling; retrying later", {
    event: "sync_pull_backfill_in_progress",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    retry_after_milliseconds,
  });
  return create_backfill_pending_pull(records_pulled, retry_after_milliseconds);
}

async function pull_incrementally(
  command: PullTableChangesCommand,
  starting_cursor: number,
): AsyncResult<TablePullSummary> {
  let cursor = starting_cursor;
  let records_pulled = 0;
  for (;;) {
    const page_result = await fetch_change_page(command, cursor);
    if (!page_result.success) return page_result;
    const response = page_result.data;
    let page: ChangePageContent;
    switch (response.status) {
      case ChangePageStatus.CURSOR_EXPIRED:
        return resync_table_from_server(command, apply_change_page);
      case ChangePageStatus.BACKFILL_IN_PROGRESS:
        return create_success_result(
          wait_for_backfill(
            command,
            records_pulled,
            response.retry_after_milliseconds,
          ),
        );
      case ChangePageStatus.CHANGES:
        page = response.page;
        break;
    }
    const applied_result = await apply_change_page(command, page);
    if (!applied_result.success) return applied_result;
    records_pulled += applied_result.data;
    if (!page.has_more)
      return create_success_result(create_completed_pull(records_pulled));
    if (page.next_cursor <= cursor)
      return create_failure_result(CURSOR_DID_NOT_ADVANCE_ERROR);
    cursor = page.next_cursor;
  }
}

export async function pull_table_changes_from_convex(
  command: PullTableChangesCommand,
): AsyncResult<TablePullSummary> {
  const cursor_result = await read_cursor_safely(command);
  if (!cursor_result.success) return cursor_result;
  const pulled = await pull_incrementally(command, cursor_result.data);
  if (pulled.success)
    console.log("[Sync:Pull] Table pull completed", {
      event: "sync_pull_table_completed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      records_pulled: pulled.data.records_pulled,
      backfill_status: pulled.data.backfill.status,
    });
  return pulled;
}
