import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  type ChangePageContent,
  type ChangePageResponse,
  ChangePageStatus,
  fetch_change_page,
  type PullTableChangesCommand,
} from "./syncChangePageFetch";
import {
  create_backfill_pending_pull,
  create_completed_pull,
  type TablePullSummary,
} from "./syncPullTypes";
import { remove_records_absent_on_server } from "./syncTableResyncApply";

const RESYNC_START_SEQUENCE = 0;
const RESYNC_CURSOR_EXPIRED_AGAIN_ERROR =
  "Server reported an expired cursor during a full resync";
const RESYNC_CURSOR_STALLED_ERROR =
  "Full resync reported more changes without advancing the cursor";

const TableResyncPhase = {
  PAGING: "paging",
  FINALIZING: "finalizing",
} as const;

type ApplyChangePage = (
  command: PullTableChangesCommand,
  page: ChangePageContent,
) => AsyncResult<number>;

const ResyncPagingOutcome = {
  PAGED: "paged",
  BACKFILL_IN_PROGRESS: "backfill_in_progress",
} as const;

type ResyncPaging =
  | { kind: typeof ResyncPagingOutcome.PAGED; progress: ResyncProgress }
  | {
      kind: typeof ResyncPagingOutcome.BACKFILL_IN_PROGRESS;
      progress: ResyncProgress;
      retry_after_milliseconds: number;
    };

interface ResyncProgress {
  cursor: number;
  records_pulled: number;
  server_local_ids: Set<string>;
}

function collect_server_local_ids(
  progress: ResyncProgress,
  page: ChangePageContent,
): Set<string> {
  for (const record of page.records)
    progress.server_local_ids.add(String(record.local_id));
  for (const tombstone of page.tombstones)
    progress.server_local_ids.delete(tombstone.local_id);
  return progress.server_local_ids;
}

const ResyncPageStepStatus = {
  CONTINUE: "continue",
  STOP: "stop",
} as const;

type ResyncPageStep =
  | { status: typeof ResyncPageStepStatus.CONTINUE; page: ChangePageContent }
  | {
      status: typeof ResyncPageStepStatus.STOP;
      result: Result<ResyncPaging>;
    };

function resolve_resync_page(
  response: ChangePageResponse,
  progress: ResyncProgress,
): ResyncPageStep {
  switch (response.status) {
    case ChangePageStatus.CURSOR_EXPIRED:
      return {
        status: ResyncPageStepStatus.STOP,
        result: create_failure_result(RESYNC_CURSOR_EXPIRED_AGAIN_ERROR),
      };
    case ChangePageStatus.BACKFILL_IN_PROGRESS:
      return {
        status: ResyncPageStepStatus.STOP,
        result: create_success_result({
          kind: ResyncPagingOutcome.BACKFILL_IN_PROGRESS,
          progress,
          retry_after_milliseconds: response.retry_after_milliseconds,
        }),
      };
    case ChangePageStatus.CHANGES:
      return { status: ResyncPageStepStatus.CONTINUE, page: response.page };
  }
}

async function page_through_server_table(
  command: PullTableChangesCommand,
  apply_page: ApplyChangePage,
): AsyncResult<ResyncPaging> {
  const progress: ResyncProgress = {
    cursor: RESYNC_START_SEQUENCE,
    records_pulled: 0,
    server_local_ids: new Set(),
  };
  for (;;) {
    const page_result = await fetch_change_page(command, progress.cursor);
    if (!page_result.success) return page_result;
    const page_step = resolve_resync_page(page_result.data, progress);
    if (page_step.status === ResyncPageStepStatus.STOP) return page_step.result;
    const page = page_step.page;
    const applied = await apply_page(command, page);
    if (!applied.success) return applied;
    collect_server_local_ids(progress, page);
    progress.records_pulled += applied.data;
    const previous_cursor = progress.cursor;
    progress.cursor = page.next_cursor;
    if (!page.has_more)
      return create_success_result({
        kind: ResyncPagingOutcome.PAGED,
        progress,
      });
    if (page.next_cursor <= previous_cursor)
      return create_failure_result(RESYNC_CURSOR_STALLED_ERROR);
  }
}

function postpone_resync(
  command: PullTableChangesCommand,
  paging: Extract<
    ResyncPaging,
    { kind: typeof ResyncPagingOutcome.BACKFILL_IN_PROGRESS }
  >,
): TablePullSummary {
  console.warn("[Sync:Resync] Server backfill running; resync postponed", {
    event: "sync_table_resync_postponed_for_backfill",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    retry_after_milliseconds: paging.retry_after_milliseconds,
  });
  return create_backfill_pending_pull(
    paging.progress.records_pulled,
    paging.retry_after_milliseconds,
  );
}

export async function resync_table_from_server(
  command: PullTableChangesCommand,
  apply_page: ApplyChangePage,
): AsyncResult<TablePullSummary> {
  console.warn("[Sync:Resync] Cursor expired; running a full table resync", {
    event: "sync_table_resync_started",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    phase: TableResyncPhase.PAGING,
  });
  const paged = await page_through_server_table(command, apply_page);
  if (!paged.success) return paged;
  if (paged.data.kind === ResyncPagingOutcome.BACKFILL_IN_PROGRESS)
    return create_success_result(postpone_resync(command, paged.data));
  const progress = paged.data.progress;
  const removed_count = await remove_records_absent_on_server(command, {
    server_local_ids: progress.server_local_ids,
    final_cursor: progress.cursor,
  });
  console.log("[Sync:Resync] Full table resync completed", {
    event: "sync_table_resync_completed",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    phase: TableResyncPhase.FINALIZING,
    records_pulled: progress.records_pulled,
    removed_count,
    final_cursor: progress.cursor,
  });
  return create_success_result(
    create_completed_pull(progress.records_pulled + removed_count),
  );
}
