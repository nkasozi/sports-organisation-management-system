import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { STORAGE_BACKUP_RESTORE_INVALID_TRANSITION_ERROR } from "./storageBackupMessages";
import {
  STORAGE_BACKUP_RESTORE_EVENT,
  STORAGE_BACKUP_RESTORE_STATUS,
  type StorageBackupRestoreBlockedEvent,
  type StorageBackupRestoreEvent,
  type StorageBackupRestoreState,
} from "./storageBackupRestoreTypes";

const STATUS = STORAGE_BACKUP_RESTORE_STATUS;
const EVENT = STORAGE_BACKUP_RESTORE_EVENT;

type TransitionResult = Result<StorageBackupRestoreState>;

type AwaitingConfirmationState = Extract<
  StorageBackupRestoreState,
  { status: typeof STATUS.AWAITING_CONFIRMATION }
>;

export function create_idle_storage_backup_restore_state(): StorageBackupRestoreState {
  return { status: STATUS.IDLE };
}

export function reject_restore_transition(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): TransitionResult {
  return create_failure_result(
    `${STORAGE_BACKUP_RESTORE_INVALID_TRANSITION_ERROR} (${current_state.status} -> ${event.type})`,
  );
}

function transition_to_blocked_state(
  event: StorageBackupRestoreBlockedEvent,
): TransitionResult {
  switch (event.type) {
    case EVENT.PENDING_LOCAL_CHANGES_DETECTED:
      return create_success_result({
        status: STATUS.BLOCKED_PENDING_LOCAL_CHANGES,
        summary: event.summary,
      });
    case EVENT.SESSION_MISMATCH_DETECTED:
      return create_success_result({
        status: STATUS.BLOCKED_SESSION_MISMATCH,
        summary: event.summary,
        safety_status: event.safety_status,
      });
    case EVENT.LOCAL_CHANGE_CHECK_FAILED:
      return create_success_result({
        status: STATUS.BLOCKED_LOCAL_CHANGE_CHECK_FAILED,
        summary: event.summary,
      });
  }
}

export function transition_from_validating(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): TransitionResult {
  switch (event.type) {
    case EVENT.VALIDATION_PASSED:
      return create_success_result({
        status: STATUS.AWAITING_CONFIRMATION,
        prepared_restore: event.prepared_restore,
      });
    case EVENT.VALIDATION_FAILED:
      return create_success_result({
        status: STATUS.FAILED,
        error: event.error,
      });
    case EVENT.PENDING_LOCAL_CHANGES_DETECTED:
    case EVENT.SESSION_MISMATCH_DETECTED:
    case EVENT.LOCAL_CHANGE_CHECK_FAILED:
      return transition_to_blocked_state(event);
    case EVENT.BACKUP_SELECTED:
    case EVENT.RESTORE_CONFIRMED:
    case EVENT.RESTORE_CANCELLED:
    case EVENT.RESTORE_SUCCEEDED:
    case EVENT.RESTORE_FAILED:
    case EVENT.RESET:
      return reject_restore_transition(current_state, event);
  }
}

export function transition_from_awaiting_confirmation(
  current_state: AwaitingConfirmationState,
  event: StorageBackupRestoreEvent,
): TransitionResult {
  switch (event.type) {
    case EVENT.RESTORE_CONFIRMED:
      return create_success_result({
        status: STATUS.RESTORING,
        summary: current_state.prepared_restore.summary,
      });
    case EVENT.RESTORE_CANCELLED:
      return create_success_result(create_idle_storage_backup_restore_state());
    case EVENT.BACKUP_SELECTED:
    case EVENT.VALIDATION_PASSED:
    case EVENT.VALIDATION_FAILED:
    case EVENT.PENDING_LOCAL_CHANGES_DETECTED:
    case EVENT.SESSION_MISMATCH_DETECTED:
    case EVENT.LOCAL_CHANGE_CHECK_FAILED:
    case EVENT.RESTORE_SUCCEEDED:
    case EVENT.RESTORE_FAILED:
    case EVENT.RESET:
      return reject_restore_transition(current_state, event);
  }
}

export function transition_from_restoring(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): TransitionResult {
  switch (event.type) {
    case EVENT.RESTORE_SUCCEEDED:
      return create_success_result({
        status: STATUS.SUCCEEDED,
        summary: event.summary,
      });
    case EVENT.RESTORE_FAILED:
      return create_success_result({
        status: STATUS.FAILED,
        error: event.error,
      });
    case EVENT.PENDING_LOCAL_CHANGES_DETECTED:
    case EVENT.SESSION_MISMATCH_DETECTED:
    case EVENT.LOCAL_CHANGE_CHECK_FAILED:
      return transition_to_blocked_state(event);
    case EVENT.BACKUP_SELECTED:
    case EVENT.VALIDATION_PASSED:
    case EVENT.VALIDATION_FAILED:
    case EVENT.RESTORE_CONFIRMED:
    case EVENT.RESTORE_CANCELLED:
    case EVENT.RESET:
      return reject_restore_transition(current_state, event);
  }
}

export function transition_from_settled(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): TransitionResult {
  switch (event.type) {
    case EVENT.BACKUP_SELECTED:
      return create_success_result({ status: STATUS.VALIDATING });
    case EVENT.RESET:
      return create_success_result(create_idle_storage_backup_restore_state());
    case EVENT.VALIDATION_PASSED:
    case EVENT.VALIDATION_FAILED:
    case EVENT.PENDING_LOCAL_CHANGES_DETECTED:
    case EVENT.SESSION_MISMATCH_DETECTED:
    case EVENT.LOCAL_CHANGE_CHECK_FAILED:
    case EVENT.RESTORE_CONFIRMED:
    case EVENT.RESTORE_CANCELLED:
    case EVENT.RESTORE_SUCCEEDED:
    case EVENT.RESTORE_FAILED:
      return reject_restore_transition(current_state, event);
  }
}
