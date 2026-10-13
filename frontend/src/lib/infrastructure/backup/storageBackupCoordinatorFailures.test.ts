import { describe, expect, it, vi } from "vitest";

import type { StorageBackupCoordinatorDependencies } from "./storageBackupContracts";
import { create_storage_backup_coordinator } from "./storageBackupCoordinator";
import { STORAGE_BACKUP_USER_MESSAGES } from "./storageBackupMessages";

function create_dependencies_with_failing_export(): StorageBackupCoordinatorDependencies {
  return {
    database_port: {
      export_table_snapshots: () =>
        Promise.reject(new Error("IDB internal failure at stack frame 7")),
      export_sync_bookkeeping: async () => ({
        outbox_entries: [],
        record_versions: [],
      }),
      replace_all_tables_atomically: vi.fn(),
      get_total_record_count: async () => 0,
    },
    bootstrap_state_port: {
      load_bootstrap_state: async () => ({
        app_initialized: true,
        seeding_complete: true,
      }),
      persist_bootstrap_state: async () => true,
    },
    device_backup_storage_port: {
      get_capability: () => ({ status: "supported" }),
      read_backup_json: async () => ({
        status: "failed",
        error: STORAGE_BACKUP_USER_MESSAGES.DEVICE_BACKUP_READ_FAILED,
      }),
      write_backup_json: vi.fn(),
      delete_backup: async () => ({ status: "deleted" }),
    },
    pending_local_change_state_port: {
      get_pending_local_change_state: async () => ({
        status: "no_pending_local_changes",
      }),
    },
    sync_suspension_port: {
      stop_background_sync: () => true,
      start_background_sync: () => true,
      stop_remote_sync: () => true,
      start_remote_sync: () => true,
      set_pulling_from_remote: () => true,
    },
    get_session_sync_marker_state: async () => ({ status: "missing" }),
    persist_session_sync_marker_state: async () => true,
    evaluate_restore_safety: vi.fn(),
    now: () => "2026-05-17T12:00:00.000Z",
  };
}

describe("storage backup coordinator failure messages", () => {
  it("returns a user-safe message when the manual export fails", async () => {
    const coordinator = create_storage_backup_coordinator(
      create_dependencies_with_failing_export(),
    );

    expect(await coordinator.create_manual_backup_json()).toEqual({
      success: false,
      error: STORAGE_BACKUP_USER_MESSAGES.BACKUP_EXPORT_FAILED,
    });
  });

  it("returns the user-safe read failure when the device backup cannot be read", async () => {
    const coordinator = create_storage_backup_coordinator(
      create_dependencies_with_failing_export(),
    );

    expect(await coordinator.restore_from_device_backup()).toEqual({
      success: false,
      error: STORAGE_BACKUP_USER_MESSAGES.DEVICE_BACKUP_READ_FAILED,
    });
  });
});
