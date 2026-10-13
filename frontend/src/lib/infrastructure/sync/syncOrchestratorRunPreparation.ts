import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import type { SyncDirection } from "$lib/core/interfaces/ports";
import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import { get_database } from "./syncDataAccess";
import {
  PushSyncAuthorizationDecision,
  verify_push_sync_auth_or_fail,
} from "./syncOrchestratorHelpers";
import { load_tables_with_pending_changes } from "./syncOrchestratorPendingTables";
import { reject_changes_role_cannot_push } from "./syncOrchestratorPermissions";
import {
  build_sync_result,
  create_empty_totals,
  type SyncRunTotals,
} from "./syncOrchestratorTotals";
import type { RejectedOutboxRecord } from "./syncPushOutcomes";
import type { ConvexClient, SyncResult } from "./syncTypes";

const OUTBOX_ERROR_SCOPE = "sync_outbox";
const PULL_DIRECTION = "pull";

function build_outbox_failure_result(
  error: string,
  start_time: number,
  total_tables: number,
): SyncResult {
  return build_sync_result(
    {
      ...create_empty_totals(),
      errors: [{ table_name: OUTBOX_ERROR_SCOPE, error }],
    },
    start_time,
    total_tables,
  );
}

export function finish_run(
  totals: SyncRunTotals,
  unpermitted: SyncRunTotals["rejected_records"],
  start_time: number,
  total_tables: number,
): SyncResult {
  return build_sync_result(
    {
      ...totals,
      rejected_records: [...unpermitted, ...totals.rejected_records],
    },
    start_time,
    total_tables,
  );
}

type PreparedRun =
  | { status: typeof PushSyncAuthorizationDecision.STOP; result: SyncResult }
  | {
      status: typeof PushSyncAuthorizationDecision.CONTINUE;
      outbox: PreparedOutbox;
    };

export async function prepare_run(
  convex_client: ConvexClient,
  direction: SyncDirection,
  run: { start_time: number; correlation_id: string; total_tables: number },
): Promise<PreparedRun> {
  const auth_failure = await verify_push_sync_auth_or_fail(
    convex_client,
    direction,
    run.start_time,
  );
  if (auth_failure.status === PushSyncAuthorizationDecision.STOP)
    return auth_failure;
  const prepared = await prepare_outbox_for_run(
    get_database(),
    direction,
    run.correlation_id,
  );
  return prepared.success
    ? { status: PushSyncAuthorizationDecision.CONTINUE, outbox: prepared.data }
    : {
        status: PushSyncAuthorizationDecision.STOP,
        result: build_outbox_failure_result(
          prepared.error,
          run.start_time,
          run.total_tables,
        ),
      };
}

interface PreparedOutbox {
  unpermitted: RejectedOutboxRecord[];
  pending_tables: Set<string>;
}

async function prepare_outbox_for_run(
  database: SportSyncDatabase,
  direction: SyncDirection,
  correlation_id: string,
): AsyncResult<PreparedOutbox> {
  const unpermitted = await reject_changes_role_cannot_push(
    direction,
    correlation_id,
  );
  if (!unpermitted.success) return unpermitted;
  const pending_tables = await load_tables_with_pending_changes(
    database,
    direction === PULL_DIRECTION,
    correlation_id,
  );
  if (!pending_tables.success) return pending_tables;
  return create_success_result({
    unpermitted: unpermitted.data,
    pending_tables: pending_tables.data,
  });
}
