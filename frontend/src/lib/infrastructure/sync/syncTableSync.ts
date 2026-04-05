import type { Table } from "dexie";
import type { SyncDirection } from "$lib/core/interfaces/ports";
import type {
  ConvexClient,
  ConflictFromServer,
  RemoteTableState,
  TableName,
} from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";
import { is_auth_error } from "./syncAuthUtils";
import { push_table_to_convex } from "./syncPushService";
import { pull_table_from_convex } from "./syncPullService";

export interface TableSyncResult {
  records_pushed: number;
  records_pulled: number;
  error: { table_name: string; error: string } | null;
  conflicts: { table_name: string; conflicts: ConflictFromServer[] } | null;
  auth_failed: boolean;
  success: boolean;
}

export async function sync_table_when_local_ahead(
  convex_client: ConvexClient,
  table_name: string,
  table: Table<
    { id: string; updated_at?: string; created_at?: string },
    string
  >,
  all_local_records: Array<{
    id: string;
    updated_at?: string;
    created_at?: string;
  }>,
  local_latest: string,
  remote_state: RemoteTableState,
  direction: SyncDirection,
  push_excluded_tables: Set<string>,
  detect_conflicts: boolean,
): Promise<TableSyncResult> {
  let records_pushed = 0;
  let records_pulled = 0;
  let auth_failed = false;
  let table_error: { table_name: string; error: string } | null = null;
  let table_conflicts: {
    table_name: string;
    conflicts: ConflictFromServer[];
  } | null = null;

  if (direction !== "pull" && !push_excluded_tables.has(table_name)) {
    const push_result = await push_table_to_convex(
      convex_client,
      table_name as TableName,
      all_local_records,
      remote_state.latest_modified_at,
      detect_conflicts,
    );

    if (!push_result.success) {
      table_error = { table_name, error: push_result.error || "Push failed" };
      auth_failed = is_auth_error(push_result.error);
      return {
        records_pushed,
        records_pulled,
        error: table_error,
        conflicts: null,
        auth_failed,
        success: false,
      };
    }
    records_pushed += push_result.records_pushed;
    if (push_result.conflicts.length > 0) {
      table_conflicts = { table_name, conflicts: push_result.conflicts };
    }
  }

  if (direction !== "push") {
    const pull_result = await pull_table_from_convex(
      convex_client,
      table,
      table_name as TableName,
      local_latest,
    );

    if (!pull_result.success) {
      table_error = { table_name, error: pull_result.error || "Pull failed" };
      return {
        records_pushed,
        records_pulled,
        error: table_error,
        conflicts: table_conflicts,
        auth_failed,
        success: false,
      };
    }
    records_pulled += pull_result.records_pulled;
  }

  return {
    records_pushed,
    records_pulled,
    error: null,
    conflicts: table_conflicts,
    auth_failed: false,
    success: true,
  };
}

export async function sync_table_when_remote_ahead(
  convex_client: ConvexClient,
  table_name: string,
  table: Table<
    { id: string; updated_at?: string; created_at?: string },
    string
  >,
  local_latest: string,
  remote_state: RemoteTableState,
  remote_is_ahead: boolean,
  direction: SyncDirection,
  push_excluded_tables: Set<string>,
  detect_conflicts: boolean,
): Promise<TableSyncResult> {
  let records_pushed = 0;
  let records_pulled = 0;
  let auth_failed = false;
  let table_error: { table_name: string; error: string } | null = null;
  let table_conflicts: {
    table_name: string;
    conflicts: ConflictFromServer[];
  } | null = null;

  if (remote_is_ahead || direction === "pull") {
    const pull_result = await pull_table_from_convex(
      convex_client,
      table,
      table_name as TableName,
      local_latest,
    );

    if (!pull_result.success) {
      table_error = { table_name, error: pull_result.error || "Pull failed" };
      return {
        records_pushed,
        records_pulled,
        error: table_error,
        conflicts: null,
        auth_failed,
        success: false,
      };
    }
    records_pulled += pull_result.records_pulled;
  }

  if (direction !== "pull" && !push_excluded_tables.has(table_name)) {
    const refreshed_records = await table.toArray();
    const push_result = await push_table_to_convex(
      convex_client,
      table_name as TableName,
      refreshed_records,
      remote_state.latest_modified_at,
      detect_conflicts,
    );

    if (!push_result.success) {
      table_error = { table_name, error: push_result.error || "Push failed" };
      auth_failed = is_auth_error(push_result.error);
      return {
        records_pushed,
        records_pulled,
        error: table_error,
        conflicts: table_conflicts,
        auth_failed,
        success: false,
      };
    }
    records_pushed += push_result.records_pushed;
    if (push_result.conflicts.length > 0) {
      table_conflicts = { table_name, conflicts: push_result.conflicts };
    }
  }

  return {
    records_pushed,
    records_pulled,
    error: null,
    conflicts: table_conflicts,
    auth_failed: false,
    success: true,
  };
}
