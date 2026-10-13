import type { StorageBackupSummary } from "$lib/infrastructure/backup/storageBackupContracts";
import {
  STORAGE_BACKUP_RESTORE_STATUS,
  type StorageBackupRestoreState,
} from "$lib/infrastructure/backup/storageBackupRestoreTypes";

import { SESSION_BLOCKED_MESSAGES } from "./settingsDataImportMessages";

export const STORAGE_BACKUP_IMPORT_VIEW_STATUS = {
  HIDDEN: "hidden",
  BUSY: "busy",
  CONFIRMATION: "confirmation",
  NOTICE: "notice",
} as const;

export const STORAGE_BACKUP_IMPORT_NOTICE_TONE = {
  WARNING: "warning",
  ERROR: "error",
} as const;

const VIEW_STATUS = STORAGE_BACKUP_IMPORT_VIEW_STATUS;
const NOTICE_TONE = STORAGE_BACKUP_IMPORT_NOTICE_TONE;

const VALIDATING_MESSAGE = "Checking backup file...";
const RESTORING_MESSAGE = "Restoring backup...";
const RELOADING_MESSAGE = "Reloading application...";
const CONFIRMATION_WARNING_MESSAGE =
  "Restoring this backup permanently replaces all data stored in this browser. Anything not included in the backup file will be lost.";
const PENDING_CHANGES_TITLE = "Unsynced changes must finish first";
const PENDING_CHANGES_MESSAGE =
  "This browser has local changes that have not synced yet. Wait for sync to finish, or sync manually, before restoring a backup.";
const CHANGE_CHECK_FAILED_TITLE = "Unsynced changes could not be checked";
const CHANGE_CHECK_FAILED_MESSAGE =
  "We could not check this browser for changes that still need to sync, so the backup was not restored. Reload the page and try the import again.";
const SESSION_BLOCKED_TITLE = "This backup cannot be restored here";
const FAILED_TITLE = "Backup could not be imported";

export type StorageBackupImportNoticeTone =
  (typeof NOTICE_TONE)[keyof typeof NOTICE_TONE];

export type StorageBackupImportView =
  | { status: typeof VIEW_STATUS.HIDDEN }
  | { status: typeof VIEW_STATUS.BUSY; message: string }
  | {
      status: typeof VIEW_STATUS.CONFIRMATION;
      summary: StorageBackupSummary;
      warning_message: string;
    }
  | {
      status: typeof VIEW_STATUS.NOTICE;
      tone: StorageBackupImportNoticeTone;
      title: string;
      message: string;
    };

function build_notice(
  tone: StorageBackupImportNoticeTone,
  title: string,
  message: string,
): StorageBackupImportView {
  return { status: VIEW_STATUS.NOTICE, tone, title, message };
}

export function build_storage_backup_import_view(
  restore_state: StorageBackupRestoreState,
): StorageBackupImportView {
  switch (restore_state.status) {
    case STORAGE_BACKUP_RESTORE_STATUS.IDLE:
      return { status: VIEW_STATUS.HIDDEN };
    case STORAGE_BACKUP_RESTORE_STATUS.VALIDATING:
      return { status: VIEW_STATUS.BUSY, message: VALIDATING_MESSAGE };
    case STORAGE_BACKUP_RESTORE_STATUS.RESTORING:
      return { status: VIEW_STATUS.BUSY, message: RESTORING_MESSAGE };
    case STORAGE_BACKUP_RESTORE_STATUS.SUCCEEDED:
      return { status: VIEW_STATUS.BUSY, message: RELOADING_MESSAGE };
    case STORAGE_BACKUP_RESTORE_STATUS.AWAITING_CONFIRMATION:
      return {
        status: VIEW_STATUS.CONFIRMATION,
        summary: restore_state.prepared_restore.summary,
        warning_message: CONFIRMATION_WARNING_MESSAGE,
      };
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_PENDING_LOCAL_CHANGES:
      return build_notice(
        NOTICE_TONE.WARNING,
        PENDING_CHANGES_TITLE,
        PENDING_CHANGES_MESSAGE,
      );
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_SESSION_MISMATCH:
      return build_notice(
        NOTICE_TONE.WARNING,
        SESSION_BLOCKED_TITLE,
        SESSION_BLOCKED_MESSAGES[restore_state.safety_status],
      );
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_LOCAL_CHANGE_CHECK_FAILED:
      return build_notice(
        NOTICE_TONE.WARNING,
        CHANGE_CHECK_FAILED_TITLE,
        CHANGE_CHECK_FAILED_MESSAGE,
      );
    case STORAGE_BACKUP_RESTORE_STATUS.FAILED:
      return build_notice(NOTICE_TONE.ERROR, FAILED_TITLE, restore_state.error);
  }
}

export function is_storage_backup_import_in_progress(
  state: StorageBackupRestoreState,
): boolean {
  switch (state.status) {
    case STORAGE_BACKUP_RESTORE_STATUS.VALIDATING:
    case STORAGE_BACKUP_RESTORE_STATUS.AWAITING_CONFIRMATION:
    case STORAGE_BACKUP_RESTORE_STATUS.RESTORING:
    case STORAGE_BACKUP_RESTORE_STATUS.SUCCEEDED:
      return true;
    case STORAGE_BACKUP_RESTORE_STATUS.IDLE:
    case STORAGE_BACKUP_RESTORE_STATUS.FAILED:
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_PENDING_LOCAL_CHANGES:
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_SESSION_MISMATCH:
    case STORAGE_BACKUP_RESTORE_STATUS.BLOCKED_LOCAL_CHANGE_CHECK_FAILED:
      return false;
  }
}
