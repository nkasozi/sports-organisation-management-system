import { create_success_result, type Result } from "$lib/core/types/Result";

import {
  reject_restore_transition,
  transition_from_awaiting_confirmation,
  transition_from_restoring,
  transition_from_settled,
  transition_from_validating,
} from "./storageBackupRestoreTransitions";
import {
  STORAGE_BACKUP_RESTORE_EVENT,
  STORAGE_BACKUP_RESTORE_STATUS,
  type StorageBackupRestoreEvent,
  type StorageBackupRestoreState,
} from "./storageBackupRestoreTypes";

export { create_idle_storage_backup_restore_state } from "./storageBackupRestoreTransitions";

const STATUS = STORAGE_BACKUP_RESTORE_STATUS;
const EVENT = STORAGE_BACKUP_RESTORE_EVENT;

export function transition_storage_backup_restore_state(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): Result<StorageBackupRestoreState> {
  switch (current_state.status) {
    case STATUS.IDLE:
      return event.type === EVENT.BACKUP_SELECTED
        ? create_success_result({ status: STATUS.VALIDATING })
        : reject_restore_transition(current_state, event);
    case STATUS.VALIDATING:
      return transition_from_validating(current_state, event);
    case STATUS.AWAITING_CONFIRMATION:
      return transition_from_awaiting_confirmation(current_state, event);
    case STATUS.RESTORING:
      return transition_from_restoring(current_state, event);
    case STATUS.SUCCEEDED:
    case STATUS.FAILED:
    case STATUS.BLOCKED_PENDING_LOCAL_CHANGES:
    case STATUS.BLOCKED_SESSION_MISMATCH:
    case STATUS.BLOCKED_LOCAL_CHANGE_CHECK_FAILED:
      return transition_from_settled(current_state, event);
  }
}
