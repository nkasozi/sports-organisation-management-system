import { describe, expect, it } from "vitest";

import {
  STORAGE_BACKUP_RESTORE_STATUS,
  type StorageBackupRestoreState,
} from "$lib/infrastructure/backup/storageBackupRestoreTypes";

import { is_storage_backup_import_in_progress } from "./settingsDataImportView";

function state_with(status: string): StorageBackupRestoreState {
  return { status } as StorageBackupRestoreState;
}

describe("is_storage_backup_import_in_progress", () => {
  it.each([
    [STORAGE_BACKUP_RESTORE_STATUS.VALIDATING, true],
    [STORAGE_BACKUP_RESTORE_STATUS.AWAITING_CONFIRMATION, true],
    [STORAGE_BACKUP_RESTORE_STATUS.RESTORING, true],
    [STORAGE_BACKUP_RESTORE_STATUS.SUCCEEDED, true],
    [STORAGE_BACKUP_RESTORE_STATUS.IDLE, false],
    [STORAGE_BACKUP_RESTORE_STATUS.FAILED, false],
    [STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_PENDING_LOCAL_CHANGES, false],
    [STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_SESSION_MISMATCH, false],
    [STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_LOCAL_CHANGE_CHECK_FAILED, false],
  ])("status %s in progress is %s", (status, expected) => {
    expect(is_storage_backup_import_in_progress(state_with(status))).toBe(
      expected,
    );
  });
});
