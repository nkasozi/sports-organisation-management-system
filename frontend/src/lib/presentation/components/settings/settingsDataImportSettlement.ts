import {
  STORAGE_BACKUP_RESTORE_STATUS,
  type StorageBackupRestoreState,
} from "$lib/infrastructure/backup/storageBackupRestoreTypes";

import {
  BACKUP_IMPORT_SUCCESS_MESSAGE,
  type ShowToast,
  TOAST_TYPE_ERROR,
  TOAST_TYPE_SUCCESS,
} from "./settingsDataManagementMessages";

interface SettledStorageBackupImportCommand {
  show_toast: ShowToast;
  refresh_page: () => void;
}

export function announce_settled_storage_backup_import(
  settled_state: StorageBackupRestoreState,
  command: SettledStorageBackupImportCommand,
): StorageBackupRestoreState {
  switch (settled_state.status) {
    case STORAGE_BACKUP_RESTORE_STATUS.SUCCEEDED:
      command.show_toast(BACKUP_IMPORT_SUCCESS_MESSAGE, TOAST_TYPE_SUCCESS);
      command.refresh_page();
      return settled_state;
    case STORAGE_BACKUP_RESTORE_STATUS.FAILED:
      command.show_toast(settled_state.error, TOAST_TYPE_ERROR);
      return settled_state;
    case STORAGE_BACKUP_RESTORE_STATUS.IDLE:
    case STORAGE_BACKUP_RESTORE_STATUS.VALIDATING:
    case STORAGE_BACKUP_RESTORE_STATUS.AWAITING_CONFIRMATION:
    case STORAGE_BACKUP_RESTORE_STATUS.RESTORING:
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_PENDING_LOCAL_CHANGES:
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_SESSION_MISMATCH:
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_LOCAL_CHANGE_CHECK_FAILED:
      return settled_state;
  }
}
