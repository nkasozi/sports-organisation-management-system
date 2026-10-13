import type { SyncDirection } from "$lib/core/interfaces/ports";

import { verify_sync_auth } from "./syncAuthUtils";
import type {
  ConflictFromServer,
  ConvexClient,
  SyncProgress,
  SyncResult,
} from "./syncTypes";

type TableConflict = {
  table_name: string;
  conflicts: ConflictFromServer[];
};

type TableResultLike = {
  errors: Array<{ table_name: string; error: string }>;
  conflicts: TableConflict[];
  records_pushed: number;
  records_pulled: number;
};

export const PushSyncAuthorizationDecision = {
  CONTINUE: "continue",
  STOP: "stop",
} as const;

type PushSyncAuthorizationState =
  | { status: typeof PushSyncAuthorizationDecision.CONTINUE }
  | { status: typeof PushSyncAuthorizationDecision.STOP; result: SyncResult };

const PULL_SYNC_DIRECTION: SyncDirection = "pull";
const AUTHENTICATED_AUTH_STATUS = "authenticated";
const AUTH_CHECK_ERROR_SCOPE = "auth_check";
const SYNC_SUMMARY_EVENT = {
  SUCCEEDED: "sync_run_succeeded",
  FAILED: "sync_run_failed",
  TABLE_ERRORS: "sync_run_table_errors",
} as const;

export async function verify_push_sync_auth_or_fail(
  convex_client: ConvexClient,
  direction: SyncDirection,
  start_time: number,
): Promise<PushSyncAuthorizationState> {
  if (direction === PULL_SYNC_DIRECTION)
    return { status: PushSyncAuthorizationDecision.CONTINUE };
  const auth_check = await verify_sync_auth(convex_client);
  if (auth_check.status === AUTHENTICATED_AUTH_STATUS) {
    console.log("[Sync] Auth verified", { event: "sync_auth_verified" });
    return { status: PushSyncAuthorizationDecision.CONTINUE };
  }

  const auth_error = `Auth verification failed: ${auth_check.error}`;
  console.error("[Sync] Auth check failed", {
    event: "sync_auth_check_failed",
    error: auth_error,
  });
  return {
    status: PushSyncAuthorizationDecision.STOP,
    result: {
      success: false,
      tables_synced: 0,
      records_pushed: 0,
      records_pulled: 0,
      errors: [{ table_name: AUTH_CHECK_ERROR_SCOPE, error: auth_error }],
      duration_ms: Date.now() - start_time,
      conflicts: [],
      rejected_records: [],
      deleted_remotely: [],
    },
  };
}

export function create_table_sync_progress(
  table_name: string,
  tables_completed: number,
  total_tables: number,
): SyncProgress {
  return {
    table_name,
    total_records: 0,
    synced_records: 0,
    status: "syncing",
    errors: [],
    tables_completed,
    total_tables,
    percentage: Math.round((tables_completed / total_tables) * 100),
  };
}

export function update_table_sync_progress(
  progress: SyncProgress,
  table_result: TableResultLike,
  tables_completed: number,
): SyncProgress {
  const first_error = table_result.errors[0];

  return {
    ...progress,
    status: first_error
      ? "error"
      : table_result.conflicts.length > 0
        ? "conflict"
        : "success",
    synced_records: table_result.records_pushed + table_result.records_pulled,
    errors: first_error ? [first_error.error] : [],
    tables_completed,
    percentage: Math.round((tables_completed / progress.total_tables) * 100),
  };
}

export function log_sync_summary(command: {
  sync_succeeded: boolean;
  duration_ms: number;
  total_pushed: number;
  total_pulled: number;
  tables_synced: number;
  total_tables: number;
  errors: Array<{ table_name: string; error: string }>;
  all_conflicts: TableConflict[];
}): boolean {
  const {
    sync_succeeded,
    duration_ms,
    total_pushed,
    total_pulled,
    tables_synced,
    total_tables,
    errors,
    all_conflicts,
  } = command;
  console.log("[Sync] Sync run finished", {
    event: sync_succeeded
      ? SYNC_SUMMARY_EVENT.SUCCEEDED
      : SYNC_SUMMARY_EVENT.FAILED,
    duration_ms,
    total_pushed,
    total_pulled,
    tables_synced,
    total_tables,
    error_count: errors.length,
    conflict_count: all_conflicts.length,
  });
  if (errors.length === 0) return true;
  console.warn("[Sync] Sync run finished with table errors", {
    event: SYNC_SUMMARY_EVENT.TABLE_ERRORS,
    errors,
  });
  return false;
}
