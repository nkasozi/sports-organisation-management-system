import type {
  SyncMetrics,
  SyncOrchestratorPort,
  SyncTableError,
} from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { SyncResult } from "$lib/infrastructure/sync/convexSyncService";
import { EPOCH_TIMESTAMP } from "$lib/infrastructure/sync/syncTypes";

import {
  create_never_last_sync_time_state,
  create_recorded_last_sync_time_state,
  SyncErrorStatus,
  type SyncState,
} from "./syncStoreTypes";

const SYNC_CONFLICT_ERROR_MESSAGE =
  "Conflicts detected. Please review and resolve.";
const SYNC_FALLBACK_ERROR_MESSAGE = "Sync failed. Please try again.";
const SYNC_REJECTED_CHANGES_MESSAGE_SUFFIX =
  "local change(s) were rejected by the server and have not been synced.";
const ORCHESTRATOR_FALLBACK_ERROR_MESSAGE = "Sync failed";
const UNKNOWN_TABLE_NAME = "unknown";

type OrchestratorSyncResult = Awaited<
  ReturnType<SyncOrchestratorPort["sync_now"]>
>;

function resolve_sync_error_message(result: SyncResult): string {
  const has_conflicts = !!result.conflicts && result.conflicts.length > 0;
  if (has_conflicts) return SYNC_CONFLICT_ERROR_MESSAGE;
  return result.errors[0]?.error ?? SYNC_FALLBACK_ERROR_MESSAGE;
}

export function resolve_sync_error_state(
  result: SyncResult,
): SyncState["error_message"] {
  if (!result.success)
    return {
      status: SyncErrorStatus.PRESENT,
      message: resolve_sync_error_message(result),
    };
  return result.rejected_records.length > 0
    ? {
        status: SyncErrorStatus.PRESENT,
        message: `${result.rejected_records.length} ${SYNC_REJECTED_CHANGES_MESSAGE_SUFFIX}`,
      }
    : { status: SyncErrorStatus.CLEAR };
}

export function create_last_sync_time_state(
  timestamp: string,
): SyncState["last_sync_at"] {
  return timestamp === EPOCH_TIMESTAMP
    ? create_never_last_sync_time_state()
    : create_recorded_last_sync_time_state(timestamp);
}

export function build_unexpected_failure_result(
  error_message: string,
): SyncResult {
  return {
    success: false,
    tables_synced: 0,
    records_pushed: 0,
    records_pulled: 0,
    errors: [{ table_name: UNKNOWN_TABLE_NAME, error: error_message }],
    duration_ms: 0,
    conflicts: [],
    rejected_records: [],
    deleted_remotely: [],
  };
}

export function to_orchestrator_result(
  result: SyncResult,
): OrchestratorSyncResult {
  if (!result.success)
    return create_failure_result<SyncTableError>({
      failed_tables: result.errors,
      message: result.errors[0]?.error ?? ORCHESTRATOR_FALLBACK_ERROR_MESSAGE,
    });
  const metrics: SyncMetrics = {
    tables_synced: result.tables_synced,
    records_pushed: result.records_pushed,
    records_pulled: result.records_pulled,
    duration_ms: result.duration_ms,
    conflicts: result.conflicts,
  };
  return create_success_result(metrics);
}
