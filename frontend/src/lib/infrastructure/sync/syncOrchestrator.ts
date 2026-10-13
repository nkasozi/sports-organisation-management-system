import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import type { SyncDirection } from "$lib/core/interfaces/ports";

import { get_database } from "./syncDataAccess";
import {
  create_table_sync_progress,
  PushSyncAuthorizationDecision,
  update_table_sync_progress,
} from "./syncOrchestratorHelpers";
import { resolve_push_excluded_tables } from "./syncOrchestratorPermissions";
import { finish_run, prepare_run } from "./syncOrchestratorRunPreparation";
import {
  accumulate_table_result,
  create_empty_totals,
  type SyncRunTotals,
} from "./syncOrchestratorTotals";
import {
  sync_backfill_deferrals,
  sync_run_cancellation,
  SYNC_RUN_CANCELLED_ERROR,
} from "./syncRunSignals";
import { sync_table_changes } from "./syncTableSync";
import type { ConvexClient, SyncProgress, SyncResult } from "./syncTypes";
import { TABLE_NAMES, type TableName } from "./syncTypes";

const CANCELLED_ERROR_SCOPE = "all";

interface TableRunContext {
  convex_client: ConvexClient;
  database: ReturnType<typeof get_database>;
  direction: SyncDirection;
  detect_conflicts: boolean;
  correlation_id: string;
  pending_tables: Set<string>;
  push_excluded_tables: Set<string>;
  on_progress: (progress: SyncProgress) => unknown;
  started_epoch: number;
}

function stop_cancelled_run(
  context: TableRunContext,
  totals: SyncRunTotals,
): SyncRunTotals {
  console.warn("[Sync] Run cancelled because sync was stopped", {
    event: "sync_run_cancelled",
    correlation_id: context.correlation_id,
  });
  return {
    ...totals,
    errors: [
      ...totals.errors,
      { table_name: CANCELLED_ERROR_SCOPE, error: SYNC_RUN_CANCELLED_ERROR },
    ],
  };
}

const IGNORE_PROGRESS = (): boolean => false;

async function run_table_syncs(
  context: TableRunContext,
  valid_tables: TableName[],
): Promise<SyncRunTotals> {
  let totals = create_empty_totals();
  for (const [table_index, table_name] of valid_tables.entries()) {
    if (totals.auth_failed) break;
    if (sync_run_cancellation.is_cancelled(context.started_epoch))
      return stop_cancelled_run(context, totals);
    const progress = create_table_sync_progress(
      table_name,
      table_index,
      valid_tables.length,
    );
    context.on_progress(progress);
    const table_result = await sync_table_changes({
      ...context,
      gate: sync_change_tracking_gate,
      backfill_deferrals: sync_backfill_deferrals,
      table_name,
      should_push:
        context.pending_tables.has(table_name) &&
        !context.push_excluded_tables.has(table_name),
    });
    totals = accumulate_table_result(totals, table_result);
    context.on_progress(
      update_table_sync_progress(progress, table_result, table_index + 1),
    );
  }
  return totals;
}

function select_valid_tables(enabled_tables: string[]): TableName[] {
  return enabled_tables.filter((table_name) =>
    TABLE_NAMES.includes(table_name as TableName),
  ) as TableName[];
}

function create_run_scope(
  on_progress: ((progress: SyncProgress) => void) | undefined,
): Pick<
  TableRunContext,
  "push_excluded_tables" | "on_progress" | "started_epoch"
> {
  return {
    push_excluded_tables: resolve_push_excluded_tables(),
    on_progress: on_progress ?? IGNORE_PROGRESS,
    started_epoch: sync_run_cancellation.current_epoch(),
  };
}

export async function sync_all_tables(
  convex_client: ConvexClient,
  direction: SyncDirection = "bidirectional",
  enabled_tables: string[] = [...TABLE_NAMES],
  on_progress?: (progress: SyncProgress) => void,
  detect_conflicts: boolean = true,
): Promise<SyncResult> {
  const start_time = Date.now();
  const correlation_id = crypto.randomUUID();
  const valid_tables = select_valid_tables(enabled_tables);
  const prepared = await prepare_run(convex_client, direction, {
    start_time,
    correlation_id,
    total_tables: valid_tables.length,
  });
  if (prepared.status === PushSyncAuthorizationDecision.STOP)
    return prepared.result;
  const totals = await run_table_syncs(
    {
      convex_client,
      database: get_database(),
      direction,
      detect_conflicts,
      correlation_id,
      pending_tables: prepared.outbox.pending_tables,
      ...create_run_scope(on_progress),
    },
    valid_tables,
  );
  return finish_run(
    totals,
    prepared.outbox.unpermitted,
    start_time,
    valid_tables.length,
  );
}
