import { describe, expect, it } from "vitest";

import type {
  PreparedStorageBackupRestore,
  StorageBackupSummary,
} from "$lib/infrastructure/backup/storageBackupContracts";
import { build_storage_backup_envelope } from "$lib/infrastructure/backup/storageBackupFormat";

import { build_storage_backup_import_view } from "./settingsDataImportView";

const summary: StorageBackupSummary = {
  created_at: "2026-05-17T12:00:00.000Z",
  source: "manual_export",
  total_tables: 37,
  tables_with_records: 2,
  total_records: 5,
  session_sync_marker_state: { status: "missing" },
};

const prepared_restore: PreparedStorageBackupRestore = {
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

describe("build_storage_backup_import_view", () => {
  it("hides the panel while idle", () => {
    expect(build_storage_backup_import_view({ status: "idle" })).toEqual({
      status: "hidden",
    });
  });

  it("shows progress while validating or restoring", () => {
    expect(build_storage_backup_import_view({ status: "validating" })).toEqual({
      status: "busy",
      message: "Checking backup file...",
    });
    expect(
      build_storage_backup_import_view({ status: "restoring", summary }),
    ).toEqual({ status: "busy", message: "Restoring backup..." });
  });

  it("shows the backup summary and an explicit data-loss warning before restoring", () => {
    expect(
      build_storage_backup_import_view({
        status: "awaiting_confirmation",
        prepared_restore,
      }),
    ).toEqual({
      status: "confirmation",
      summary,
      warning_message:
        "Restoring this backup permanently replaces all data stored in this browser. Anything not included in the backup file will be lost.",
    });
  });

  it("explains a pending-changes block", () => {
    expect(
      build_storage_backup_import_view({
        status: "blocked_pending_local_changes",
        summary,
      }),
    ).toEqual({
      status: "notice",
      tone: "warning",
      title: "Unsynced changes must finish first",
      message:
        "This browser has local changes that have not synced yet. Wait for sync to finish, or sync manually, before restoring a backup.",
    });
  });

  it("explains each session block reason", () => {
    expect(
      build_storage_backup_import_view({
        status: "blocked_session_mismatch",
        summary,
        safety_status: "blocked_active_session_mismatch",
      }),
    ).toMatchObject({
      status: "notice",
      tone: "warning",
      message:
        "This backup was created in a different signed-in session and cannot be restored here.",
    });
    expect(
      build_storage_backup_import_view({
        status: "blocked_session_mismatch",
        summary,
        safety_status: "blocked_signed_out_verified_backup",
      }),
    ).toMatchObject({
      message:
        "This backup belongs to a signed-in session and cannot be restored while signed out.",
    });
    expect(
      build_storage_backup_import_view({
        status: "blocked_session_mismatch",
        summary,
        safety_status: "blocked_signed_out_unmarked_backup",
      }),
    ).toMatchObject({
      message:
        "This backup has no session information, so it cannot be restored safely.",
    });
  });

  it.each([
    ["blocked_active_user_mismatch", "different account"],
    ["blocked_active_user_unresolved", "could not confirm"],
    ["blocked_legacy_session_mismatch", "older version"],
  ] as const)("explains the %s block reason", (safety_status, fragment) => {
    const view = build_storage_backup_import_view({
      status: "blocked_session_mismatch",
      summary,
      safety_status,
    });

    expect(view.status).toBe("notice");
    if (view.status !== "notice") return;
    expect(view.message).toContain(fragment);
  });

  it("shows failures as an error notice", () => {
    expect(
      build_storage_backup_import_view({
        status: "failed",
        error: "Backup JSON is invalid",
      }),
    ).toEqual({
      status: "notice",
      tone: "error",
      title: "Backup could not be imported",
      message: "Backup JSON is invalid",
    });
  });

  it("shows a reload message after success", () => {
    expect(
      build_storage_backup_import_view({ status: "succeeded", summary }),
    ).toEqual({ status: "busy", message: "Reloading application..." });
  });
});
