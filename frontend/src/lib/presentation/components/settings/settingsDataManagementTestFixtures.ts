import type {
  PreparedStorageBackupRestore,
  StorageBackupSummary,
} from "$lib/infrastructure/backup/storageBackupContracts";
import { build_storage_backup_envelope } from "$lib/infrastructure/backup/storageBackupFormat";
import type { StorageBackupRestoreState } from "$lib/infrastructure/backup/storageBackupRestoreTypes";

export const summary: StorageBackupSummary = {
  created_at: "2026-05-17T12:00:00.000Z",
  source: "manual_export",
  total_tables: 37,
  tables_with_records: 2,
  total_records: 2,
  session_sync_marker_state: { status: "missing" },
};

export const prepared_restore: PreparedStorageBackupRestore = {
  summary,
  envelope: build_storage_backup_envelope({
    created_at: summary.created_at,
    source: "manual_export",
    app_initialized: true,
    seeding_complete: true,
    session_sync_marker_state: { status: "missing" },
    table_snapshots: [],
    sync_bookkeeping: { outbox_entries: [], record_versions: [] },
  }),
  validated_table_snapshots: [],
};

export const awaiting_state: StorageBackupRestoreState = {
  status: "awaiting_confirmation",
  prepared_restore,
};
