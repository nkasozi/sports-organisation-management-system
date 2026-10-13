import type { BlockedRecoverableSessionSyncMarkerSafetyStatus } from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  PreparedStorageBackupRestore,
  StorageBackupSummary,
} from "./storageBackupContracts";

export const STORAGE_BACKUP_RESTORE_STATUS = {
  IDLE: "idle",
  VALIDATING: "validating",
  AWAITING_CONFIRMATION: "awaiting_confirmation",
  RESTORING: "restoring",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  BLOCKED_PENDING_LOCAL_CHANGES: "blocked_pending_local_changes",
  BLOCKED_SESSION_MISMATCH: "blocked_session_mismatch",
  BLOCKED_LOCAL_CHANGE_CHECK_FAILED: "blocked_local_change_check_failed",
} as const;

export const STORAGE_BACKUP_RESTORE_EVENT = {
  BACKUP_SELECTED: "backup_selected",
  VALIDATION_PASSED: "validation_passed",
  VALIDATION_FAILED: "validation_failed",
  PENDING_LOCAL_CHANGES_DETECTED: "pending_local_changes_detected",
  SESSION_MISMATCH_DETECTED: "session_mismatch_detected",
  LOCAL_CHANGE_CHECK_FAILED: "local_change_check_failed",
  RESTORE_CONFIRMED: "restore_confirmed",
  RESTORE_CANCELLED: "restore_cancelled",
  RESTORE_SUCCEEDED: "restore_succeeded",
  RESTORE_FAILED: "restore_failed",
  RESET: "reset",
} as const;

const STATUS = STORAGE_BACKUP_RESTORE_STATUS;
const EVENT = STORAGE_BACKUP_RESTORE_EVENT;

export type StorageBackupRestoreState =
  | { status: typeof STATUS.IDLE }
  | { status: typeof STATUS.VALIDATING }
  | {
      status: typeof STATUS.AWAITING_CONFIRMATION;
      prepared_restore: PreparedStorageBackupRestore;
    }
  | { status: typeof STATUS.RESTORING; summary: StorageBackupSummary }
  | { status: typeof STATUS.SUCCEEDED; summary: StorageBackupSummary }
  | { status: typeof STATUS.FAILED; error: string }
  | {
      status: typeof STATUS.BLOCKED_PENDING_LOCAL_CHANGES;
      summary: StorageBackupSummary;
    }
  | {
      status: typeof STATUS.BLOCKED_SESSION_MISMATCH;
      summary: StorageBackupSummary;
      safety_status: BlockedRecoverableSessionSyncMarkerSafetyStatus;
    }
  | {
      status: typeof STATUS.BLOCKED_LOCAL_CHANGE_CHECK_FAILED;
      summary: StorageBackupSummary;
    };

export type StorageBackupRestoreBlockedEvent =
  | {
      type: typeof EVENT.PENDING_LOCAL_CHANGES_DETECTED;
      summary: StorageBackupSummary;
    }
  | {
      type: typeof EVENT.SESSION_MISMATCH_DETECTED;
      summary: StorageBackupSummary;
      safety_status: BlockedRecoverableSessionSyncMarkerSafetyStatus;
    }
  | {
      type: typeof EVENT.LOCAL_CHANGE_CHECK_FAILED;
      summary: StorageBackupSummary;
    };

export type StorageBackupPreparationEvent =
  | {
      type: typeof EVENT.VALIDATION_PASSED;
      prepared_restore: PreparedStorageBackupRestore;
    }
  | { type: typeof EVENT.VALIDATION_FAILED; error: string }
  | StorageBackupRestoreBlockedEvent;

export type StorageBackupRestoreOutcomeEvent =
  | { type: typeof EVENT.RESTORE_SUCCEEDED; summary: StorageBackupSummary }
  | { type: typeof EVENT.RESTORE_FAILED; error: string }
  | StorageBackupRestoreBlockedEvent;

export type StorageBackupRestoreEvent =
  | { type: typeof EVENT.BACKUP_SELECTED }
  | { type: typeof EVENT.RESTORE_CONFIRMED }
  | { type: typeof EVENT.RESTORE_CANCELLED }
  | { type: typeof EVENT.RESET }
  | StorageBackupPreparationEvent
  | StorageBackupRestoreOutcomeEvent;
