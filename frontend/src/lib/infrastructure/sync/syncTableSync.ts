import type { Table } from "dexie";

import type { SyncDirection } from "$lib/core/interfaces/ports";

import { is_auth_error } from "./syncAuthUtils";
import { remediate_oversized_inline_file_records } from "./syncInlineFileRemediation";
import { pull_table_from_convex } from "./syncPullService";
import { push_table_to_convex } from "./syncPushService";
import { get_pulling_from_remote, set_pulling_from_remote } from "./syncState";
import type {
  ConflictFromServer,
  ConvexClient,
  RemoteTableState,
  TableName,
} from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";

const PUSH_REMEDIATION_FAILED_MESSAGE = "Push remediation failed";

interface TableSyncResult {
  records_pushed: number;
  records_pulled: number;
  errors: Array<{ table_name: string; error: string }>;
  conflicts: Array<{ table_name: string; conflicts: ConflictFromServer[] }>;
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
  const table_conflicts: Array<{
    table_name: string;
    conflicts: ConflictFromServer[];
  }> = [];

  if (direction !== "pull" && !push_excluded_tables.has(table_name)) {
    const remediation_result = await remediate_oversized_inline_file_records({
      table,
      table_name: table_name as TableName,
      all_local_records: all_local_records as Array<
        Record<string, unknown> & {
          id: string;
          updated_at?: string;
          created_at?: string;
        }
      >,
      remote_latest_modified_at:
        remote_state.latest_modified_at || EPOCH_TIMESTAMP,
      detect_conflicts,
      get_is_remote_sync_in_progress: get_pulling_from_remote,
      set_remote_sync_in_progress: set_pulling_from_remote,
    });

    if (!remediation_result.success) {
      return {
        records_pushed,
        records_pulled,
        errors: [
          {
            table_name,
            error: remediation_result.error || PUSH_REMEDIATION_FAILED_MESSAGE,
          },
        ],
        conflicts: [],
        auth_failed,
        success: false,
      };
    }

    const push_result = await push_table_to_convex(
      convex_client,
      table_name as TableName,
      remediation_result.data.records,
      remote_state.latest_modified_at || EPOCH_TIMESTAMP,
      detect_conflicts,
    );

    if (!push_result.success) {
      auth_failed = is_auth_error(push_result.error);
      return {
        records_pushed,
        records_pulled,
        errors: [{ table_name, error: push_result.error }],
        conflicts: [],
        auth_failed,
        success: false,
      };
    }
    records_pushed += push_result.data.records_pushed;
    if (push_result.data.conflicts.length > 0) {
      table_conflicts.push({
        table_name,
        conflicts: push_result.data.conflicts,
      });
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
      return {
        records_pushed,
        records_pulled,
        errors: [{ table_name, error: pull_result.error }],
        conflicts: table_conflicts,
        auth_failed,
        success: false,
      };
    }
    records_pulled += pull_result.data.records_pulled;
  }

  return {
    records_pushed,
    records_pulled,
    errors: [],
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
  const table_conflicts: Array<{
    table_name: string;
    conflicts: ConflictFromServer[];
  }> = [];

  if (remote_is_ahead || direction === "pull") {
    const pull_result = await pull_table_from_convex(
      convex_client,
      table,
      table_name as TableName,
      local_latest,
    );

    if (!pull_result.success) {
      return {
        records_pushed,
        records_pulled,
        errors: [{ table_name, error: pull_result.error }],
        conflicts: [],
        auth_failed,
        success: false,
      };
    }
    records_pulled += pull_result.data.records_pulled;
  }

  if (direction !== "pull" && !push_excluded_tables.has(table_name)) {
    const refreshed_records = await table.toArray();
    const remediation_result = await remediate_oversized_inline_file_records({
      table,
      table_name: table_name as TableName,
      all_local_records: refreshed_records as Array<
        Record<string, unknown> & {
          id: string;
          updated_at?: string;
          created_at?: string;
        }
      >,
      remote_latest_modified_at:
        remote_state.latest_modified_at || EPOCH_TIMESTAMP,
      detect_conflicts,
      get_is_remote_sync_in_progress: get_pulling_from_remote,
      set_remote_sync_in_progress: set_pulling_from_remote,
    });

    if (!remediation_result.success) {
      return {
        records_pushed,
        records_pulled,
        errors: [
          {
            table_name,
            error: remediation_result.error || PUSH_REMEDIATION_FAILED_MESSAGE,
          },
        ],
        conflicts: table_conflicts,
        auth_failed,
        success: false,
      };
    }

    const push_result = await push_table_to_convex(
      convex_client,
      table_name as TableName,
      remediation_result.data.records,
      remote_state.latest_modified_at || EPOCH_TIMESTAMP,
      detect_conflicts,
    );

    if (!push_result.success) {
      auth_failed = is_auth_error(push_result.error);
      return {
        records_pushed,
        records_pulled,
        errors: [{ table_name, error: push_result.error }],
        conflicts: table_conflicts,
        auth_failed,
        success: false,
      };
    }
    records_pushed += push_result.data.records_pushed;
    if (push_result.data.conflicts.length > 0) {
      table_conflicts.push({
        table_name,
        conflicts: push_result.data.conflicts,
      });
    }
  }

  return {
    records_pushed,
    records_pulled,
    errors: [],
    conflicts: table_conflicts,
    auth_failed: false,
    success: true,
  };
}
