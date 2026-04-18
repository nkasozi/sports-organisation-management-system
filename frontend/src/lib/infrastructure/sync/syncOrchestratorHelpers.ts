import type { SyncDirection, SyncHints } from "$lib/core/interfaces/ports";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { verify_sync_auth } from "./syncAuthUtils";
import { get_remote_state_for_table } from "./syncDataAccess";
import type {
  ConflictFromServer,
  ConvexClient,
  RemoteTableState,
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

type PushSyncAuthorizationState =
  | { status: "continue" }
  | { status: "stop"; result: SyncResult };

export async function verify_push_sync_auth_or_fail(
  convex_client: ConvexClient,
  direction: SyncDirection,
  start_time: number,
): Promise<PushSyncAuthorizationState> {
  if (direction === "pull") return { status: "continue" };
  const auth_check = await verify_sync_auth(convex_client);
  if (auth_check.status === "authenticated") {
    console.log("[Sync] Auth verified — Convex client is authenticated");
    return { status: "continue" };
  }

  const auth_error = `Auth verification failed: ${auth_check.error}`;
  console.error(`[Sync] ${auth_error}`);
  return {
    status: "stop",
    result: {
      success: false,
      tables_synced: 0,
      records_pushed: 0,
      records_pulled: 0,
      errors: [{ table_name: "auth_check", error: auth_error }],
      duration_ms: Date.now() - start_time,
      conflicts: [],
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

export async function load_remote_table_state(
  convex_client: ConvexClient,
  table_name: string,
  hints?: SyncHints,
): AsyncResult<RemoteTableState> {
  try {
    return create_success_result(
      await get_remote_state_for_table(convex_client, table_name, hints),
    );
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error("[Sync] Failed to get remote state", {
      event: "sync_remote_state_failed",
      table_name,
      error: String(error_message),
    });

    return create_failure_result(error_message);
  }
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
}): void {
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
  console.log(
    `[Sync] ===== Sync ${sync_succeeded ? "SUCCEEDED" : "FAILED"} in ${duration_ms}ms — ` +
      `pushed: ${total_pushed}, pulled: ${total_pulled}, tables: ${tables_synced}/${total_tables}, ` +
      `errors: ${errors.length}, conflicts: ${all_conflicts.length} =====`,
  );
  if (errors.length === 0) return;
  console.warn(
    "[Sync] Errors:",
    errors.map((error) => `${error.table_name}: ${error.error}`).join("; "),
  );
}
