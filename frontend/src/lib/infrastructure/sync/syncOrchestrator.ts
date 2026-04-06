import type {
  SyncDirection,
  SyncHints,
  UserRole,
} from "$lib/core/interfaces/ports";
import { current_user_role } from "../../presentation/stores/auth";
import { get } from "svelte/store";
import type { ConvexClient, SyncProgress, SyncResult } from "./syncTypes";
import {
  EPOCH_TIMESTAMP,
  TABLE_NAMES,
  type TableName,
  get_push_excluded_tables,
} from "./syncTypes";
import {
  get_local_latest_modified_at,
  get_table_from_database,
  get_remote_state_for_table,
  get_database,
} from "./syncDataAccess";
import { verify_sync_auth } from "./syncAuthUtils";
import {
  sync_table_when_local_ahead,
  sync_table_when_remote_ahead,
} from "./syncTableSync";
import type { RemoteTableState } from "./syncTypes";

export async function sync_all_tables(
  convex_client: ConvexClient,
  direction: SyncDirection = "bidirectional",
  enabled_tables: string[] = [...TABLE_NAMES],
  on_progress?: (progress: SyncProgress) => void,
  detect_conflicts: boolean = true,
  hints?: SyncHints,
): Promise<SyncResult> {
  const start_time = Date.now();
  const database = get_database();
  const errors: Array<{ table_name: string; error: string }> = [];
  const all_conflicts: Array<{
    table_name: string;
    conflicts: import("./syncTypes").ConflictFromServer[];
  }> = [];
  let total_pushed = 0;
  let total_pulled = 0;
  let tables_synced = 0;
  let auth_failed = false;

  const valid_tables = enabled_tables.filter((t) =>
    TABLE_NAMES.includes(t as TableName),
  );
  const total_tables = valid_tables.length;
  let tables_completed = 0;

  const role = get(current_user_role);
  const push_excluded_tables = get_push_excluded_tables(role);

  console.log(
    `[Sync] ===== Starting sync: direction=${direction}, tables=${total_tables}, role=${role} =====`,
  );

  if (direction !== "pull") {
    const auth_check = await verify_sync_auth(convex_client);
    if (!auth_check.authenticated) {
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
    console.log("[Sync] Auth verified — Convex client is authenticated");
  }

  for (const table_name of valid_tables) {
    if (auth_failed) {
      console.warn(
        `[Sync] ${table_name} — SKIPPED (auth failed on earlier table)`,
      );
      tables_completed++;
      continue;
    }

    const percentage = Math.round((tables_completed / total_tables) * 100);
    const progress: SyncProgress = {
      table_name,
      total_records: 0,
      synced_records: 0,
      status: "syncing",
      error_message: null,
      tables_completed,
      total_tables,
      percentage,
    };
    if (on_progress) on_progress(progress);

    const table = get_table_from_database(database, table_name as TableName);
    if (!table) {
      console.warn(
        `[Sync] ${table_name} — table not found in database, skipping`,
      );
      errors.push({ table_name, error: `Table ${table_name} not found` });
      tables_completed++;
      continue;
    }

    const all_local_records = await table.toArray();
    const local_latest = get_local_latest_modified_at(all_local_records);

    let remote_state: RemoteTableState = {
      record_count: 0,
      latest_modified_at: null,
    };
    try {
      remote_state = await get_remote_state_for_table(
        convex_client,
        table_name,
        hints,
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : String(error);
      console.error("[Sync] Failed to get remote state", {
        event: "sync_remote_state_failed",
        table_name,
        error: String(error_message),
      });
      errors.push({ table_name, error: error_message });
      tables_completed++;
      continue;
    }

    const remote_latest = remote_state.latest_modified_at || EPOCH_TIMESTAMP;
    const local_is_ahead = local_latest > remote_latest;
    const remote_is_ahead = remote_latest > local_latest;
    const are_in_sync =
      !local_is_ahead && !remote_is_ahead && remote_latest !== EPOCH_TIMESTAMP;

    console.log(
      `[Sync] ${table_name} — local: ${all_local_records.length} records (latest: ${local_latest}), ` +
        `remote: ${remote_state.record_count} records (latest: ${remote_latest}), ` +
        `${local_is_ahead ? "LOCAL ahead" : remote_is_ahead ? "REMOTE ahead" : "IN SYNC"}`,
    );

    if (are_in_sync && direction === "bidirectional") {
      console.log(`[Sync] ${table_name} — already in sync, skipping`);
      tables_synced++;
      tables_completed++;
      if (on_progress) {
        on_progress({
          table_name,
          total_records: all_local_records.length,
          synced_records: 0,
          status: "success",
          error_message: null,
          tables_completed,
          total_tables,
          percentage: Math.round((tables_completed / total_tables) * 100),
        });
      }
      continue;
    }

    const table_result =
      local_is_ahead || direction === "push"
        ? await sync_table_when_local_ahead(
            convex_client,
            table_name,
            table,
            all_local_records,
            local_latest,
            remote_state,
            direction,
            push_excluded_tables,
            detect_conflicts,
          )
        : await sync_table_when_remote_ahead(
            convex_client,
            table_name,
            table,
            local_latest,
            remote_state,
            remote_is_ahead,
            direction,
            push_excluded_tables,
            detect_conflicts,
          );

    total_pushed += table_result.records_pushed;
    total_pulled += table_result.records_pulled;
    if (table_result.error) errors.push(table_result.error);
    if (table_result.conflicts) all_conflicts.push(table_result.conflicts);
    if (table_result.auth_failed) auth_failed = true;

    tables_completed++;
    if (table_result.success && !table_result.conflicts) tables_synced++;

    progress.status = table_result.error
      ? "error"
      : table_result.conflicts
        ? "conflict"
        : "success";
    progress.synced_records =
      table_result.records_pushed + table_result.records_pulled;
    progress.error_message = table_result.error?.error ?? null;
    progress.tables_completed = tables_completed;
    progress.percentage = Math.round((tables_completed / total_tables) * 100);
    if (on_progress) on_progress(progress);
  }

  const has_conflicts = all_conflicts.length > 0;
  const sync_succeeded = errors.length === 0 && !has_conflicts;
  const duration_ms = Date.now() - start_time;

  console.log(
    `[Sync] ===== Sync ${sync_succeeded ? "SUCCEEDED" : "FAILED"} in ${duration_ms}ms — ` +
      `pushed: ${total_pushed}, pulled: ${total_pulled}, tables: ${tables_synced}/${total_tables}, ` +
      `errors: ${errors.length}, conflicts: ${all_conflicts.length} =====`,
  );

  if (errors.length > 0) {
    console.warn(
      "[Sync] Errors:",
      errors.map((e) => `${e.table_name}: ${e.error}`).join("; "),
    );
  }

  return {
    success: sync_succeeded,
    tables_synced,
    records_pushed: total_pushed,
    records_pulled: total_pulled,
    errors,
    duration_ms,
    conflicts: all_conflicts,
  };
}

export async function sync_single_table(
  convex_client: ConvexClient,
  table_name: string,
  direction: SyncDirection = "bidirectional",
): Promise<SyncResult> {
  return sync_all_tables(convex_client, direction, [table_name]);
}
