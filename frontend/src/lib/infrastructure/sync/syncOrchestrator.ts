import { get } from "svelte/store";

import type { SyncDirection, SyncHints } from "$lib/core/interfaces/ports";

import { current_user_role } from "../../presentation/stores/auth";
import {
  get_database,
  get_local_latest_modified_at,
  get_table_from_database,
} from "./syncDataAccess";
import {
  create_table_sync_progress,
  load_remote_table_state,
  log_sync_summary,
  update_table_sync_progress,
  verify_push_sync_auth_or_fail,
} from "./syncOrchestratorHelpers";
import {
  sync_table_when_local_ahead,
  sync_table_when_remote_ahead,
} from "./syncTableSync";
import type { ConvexClient, SyncProgress, SyncResult } from "./syncTypes";
import {
  EPOCH_TIMESTAMP,
  get_push_excluded_tables,
  TABLE_NAMES,
  type TableName,
} from "./syncTypes";

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
  const auth_failure = await verify_push_sync_auth_or_fail(
    convex_client,
    direction,
    start_time,
  );
  if (auth_failure) return auth_failure;

  for (const table_name of valid_tables) {
    if (auth_failed) {
      console.warn(
        `[Sync] ${table_name} — SKIPPED (auth failed on earlier table)`,
      );
      tables_completed++;
      continue;
    }

    const progress: SyncProgress = create_table_sync_progress(
      table_name,
      tables_completed,
      total_tables,
    );
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
    const remote_state_result = await load_remote_table_state(
      convex_client,
      table_name,
      hints,
    );
    if (!remote_state_result.state) {
      errors.push({
        table_name,
        error: remote_state_result.error_message ?? "Unknown error",
      });
      tables_completed++;
      continue;
    }
    const remote_state = remote_state_result.state;
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
    if (on_progress)
      on_progress(
        update_table_sync_progress(progress, table_result, tables_completed),
      );
  }
  const has_conflicts = all_conflicts.length > 0;
  const sync_succeeded = errors.length === 0 && !has_conflicts;
  const duration_ms = Date.now() - start_time;
  log_sync_summary({
    sync_succeeded,
    duration_ms,
    total_pushed,
    total_pulled,
    tables_synced,
    total_tables,
    errors,
    all_conflicts,
  });

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
