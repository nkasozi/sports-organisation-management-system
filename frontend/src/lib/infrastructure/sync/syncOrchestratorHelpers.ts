import type { SyncDirection, SyncHints } from "$lib/core/interfaces/ports";

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
  error?: { table_name: string; error: string } | null;
  conflicts?: TableConflict | null;
  records_pushed: number;
  records_pulled: number;
};

export async function verify_push_sync_auth_or_fail(
  convex_client: ConvexClient,
  direction: SyncDirection,
  start_time: number,
): Promise<SyncResult | null> {
  if (direction === "pull") return null;
  const auth_check = await verify_sync_auth(convex_client);
  if (auth_check.authenticated) {
    console.log("[Sync] Auth verified — Convex client is authenticated");
    return null;
  }

  const auth_error = auth_check.error
    ? `Auth verification failed: ${auth_check.error}`
    : "Convex client is NOT authenticated — cannot push data. Check Clerk session and JWT template.";
  console.error(`[Sync] ${auth_error}`);
  return {
    success: false,
    tables_synced: 0,
    records_pushed: 0,
    records_pulled: 0,
    errors: [{ table_name: "auth_check", error: auth_error }],
    duration_ms: Date.now() - start_time,
    conflicts: [],
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
    error_message: null,
    tables_completed,
    total_tables,
    percentage: Math.round((tables_completed / total_tables) * 100),
  };
}

export async function load_remote_table_state(
  convex_client: ConvexClient,
  table_name: string,
  hints?: SyncHints,
): Promise<{ state: RemoteTableState | null; error_message: string | null }> {
  try {
    return {
      state: await get_remote_state_for_table(convex_client, table_name, hints),
      error_message: null,
    };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error("[Sync] Failed to get remote state", {
      event: "sync_remote_state_failed",
      table_name,
      error: String(error_message),
    });
    return { state: null, error_message };
  }
}

export function update_table_sync_progress(
  progress: SyncProgress,
  table_result: TableResultLike,
  tables_completed: number,
): SyncProgress {
  return {
    ...progress,
    status: table_result.error
      ? "error"
      : table_result.conflicts
        ? "conflict"
        : "success",
    synced_records: table_result.records_pushed + table_result.records_pulled,
    error_message: table_result.error?.error ?? null,
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
