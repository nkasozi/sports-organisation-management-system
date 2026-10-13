import { expect } from "vitest";

import type {
  PreparedStorageBackupRestore,
  StorageBackupSummary,
} from "./storageBackupContracts";
import { build_storage_backup_envelope } from "./storageBackupFormat";
import { transition_storage_backup_restore_state } from "./storageBackupRestoreMachine";
import type {
  StorageBackupRestoreEvent,
  StorageBackupRestoreState,
} from "./storageBackupRestoreTypes";

export const summary: StorageBackupSummary = {
  created_at: "2026-05-17T12:00:00.000Z",
  source: "manual_export",
  total_tables: 37,
  tables_with_records: 1,
  total_records: 1,
  session_sync_marker_state: {
    status: "present",
    marker: { mode: "anonymous" },
  },
};

export const prepared_restore: PreparedStorageBackupRestore = {
  summary,
  envelope: build_storage_backup_envelope({
    created_at: summary.created_at,
    source: "manual_export",
    app_initialized: true,
    seeding_complete: true,
    session_sync_marker_state: summary.session_sync_marker_state,
    table_snapshots: [{ table_name: "teams", records: [{ id: "team-1" }] }],
    sync_bookkeeping: { outbox_entries: [], record_versions: [] },
  }),
  validated_table_snapshots: [
    { table_name: "teams", records: [{ id: "team-1" }] },
  ],
};

export const idle_state: StorageBackupRestoreState = { status: "idle" };
export const validating_state: StorageBackupRestoreState = {
  status: "validating",
};
export const awaiting_state: StorageBackupRestoreState = {
  status: "awaiting_confirmation",
  prepared_restore,
};
export const restoring_state: StorageBackupRestoreState = {
  status: "restoring",
  summary,
};
export const failed_state: StorageBackupRestoreState = {
  status: "failed",
  error: "Backup JSON is invalid",
};
export const blocked_pending_state: StorageBackupRestoreState = {
  status: "blocked_pending_local_changes",
  summary,
};
export const blocked_session_state: StorageBackupRestoreState = {
  status: "blocked_session_mismatch",
  summary,
  safety_status: "blocked_signed_out_verified_backup",
};
export const succeeded_state: StorageBackupRestoreState = {
  status: "succeeded",
  summary,
};

export const pending_event: StorageBackupRestoreEvent = {
  type: "pending_local_changes_detected",
  summary,
};
export const session_event: StorageBackupRestoreEvent = {
  type: "session_mismatch_detected",
  summary,
  safety_status: "blocked_signed_out_verified_backup",
};

export function expect_transition(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
  expected_state: StorageBackupRestoreState,
): void {
  expect(transition_storage_backup_restore_state(current_state, event)).toEqual(
    { success: true, data: expected_state },
  );
}

export function expect_rejected_transition(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): void {
  expect(transition_storage_backup_restore_state(current_state, event)).toEqual(
    {
      success: false,
      error: `Invalid storage backup restore transition (${current_state.status} -> ${event.type})`,
    },
  );
}
