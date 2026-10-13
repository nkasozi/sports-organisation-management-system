import { log_sync_summary } from "./syncOrchestratorHelpers";
import type { TableSyncResult } from "./syncTableSync";
import type { SyncResult } from "./syncTypes";

export interface SyncRunTotals {
  total_pushed: number;
  total_pulled: number;
  tables_synced: number;
  errors: SyncResult["errors"];
  all_conflicts: SyncResult["conflicts"];
  rejected_records: SyncResult["rejected_records"];
  deleted_remotely: SyncResult["deleted_remotely"];
  auth_failed: boolean;
}

export function create_empty_totals(): SyncRunTotals {
  return {
    total_pushed: 0,
    total_pulled: 0,
    tables_synced: 0,
    errors: [],
    all_conflicts: [],
    rejected_records: [],
    deleted_remotely: [],
    auth_failed: false,
  };
}

export function accumulate_table_result(
  totals: SyncRunTotals,
  table_result: TableSyncResult,
): SyncRunTotals {
  return {
    total_pushed: totals.total_pushed + table_result.records_pushed,
    total_pulled: totals.total_pulled + table_result.records_pulled,
    tables_synced:
      totals.tables_synced +
      (table_result.success && table_result.conflicts.length === 0 ? 1 : 0),
    errors: [...totals.errors, ...table_result.errors],
    all_conflicts: [...totals.all_conflicts, ...table_result.conflicts],
    rejected_records: [
      ...totals.rejected_records,
      ...table_result.rejected_records,
    ],
    deleted_remotely: [
      ...totals.deleted_remotely,
      ...table_result.deleted_remotely,
    ],
    auth_failed: totals.auth_failed || table_result.auth_failed,
  };
}

export function build_sync_result(
  totals: SyncRunTotals,
  start_time: number,
  total_tables: number,
): SyncResult {
  const sync_succeeded =
    totals.errors.length === 0 && totals.all_conflicts.length === 0;
  const duration_ms = Date.now() - start_time;
  log_sync_summary({ ...totals, sync_succeeded, duration_ms, total_tables });
  return {
    success: sync_succeeded,
    tables_synced: totals.tables_synced,
    records_pushed: totals.total_pushed,
    records_pulled: totals.total_pulled,
    errors: totals.errors,
    duration_ms,
    conflicts: totals.all_conflicts,
    rejected_records: totals.rejected_records,
    deleted_remotely: totals.deleted_remotely,
  };
}
