import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import {
  is_recoverable_session_sync_marker_safety_blocking,
  type RecoverableSessionSyncMarkerSafety,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  PendingLocalChangeState,
  PreparedStorageBackupRestore,
  StorageBackupCoordinatorDependencies,
  StorageBackupSummary,
} from "./storageBackupContracts";
import {
  STORAGE_BACKUP_RESTORE_EVENT,
  type StorageBackupRestoreBlockedEvent,
} from "./storageBackupRestoreTypes";
import { PENDING_LOCAL_CHANGE_STATUS } from "./storageBackupStatus";

const STORAGE_BACKUP_RESTORE_BLOCKED_EVENT = "storage_backup_restore_blocked";

export const RESTORE_GUARD_STATUS = {
  CLEAR: "clear",
  BLOCKED: "blocked",
} as const;

type RestoreGuardState =
  | {
      status: typeof RESTORE_GUARD_STATUS.CLEAR;
      safety: RecoverableSessionSyncMarkerSafety;
    }
  | {
      status: typeof RESTORE_GUARD_STATUS.BLOCKED;
      event: StorageBackupRestoreBlockedEvent;
    };

function block_restore(
  event: StorageBackupRestoreBlockedEvent,
): RestoreGuardState {
  return { status: RESTORE_GUARD_STATUS.BLOCKED, event };
}

function evaluate_pending_local_change_guard(
  pending_state: PendingLocalChangeState,
  summary: StorageBackupSummary,
): Option<RestoreGuardState> {
  switch (pending_state.status) {
    case PENDING_LOCAL_CHANGE_STATUS.PENDING_LOCAL_CHANGES_PRESENT:
      return create_some_option(
        block_restore({
          type: STORAGE_BACKUP_RESTORE_EVENT.PENDING_LOCAL_CHANGES_DETECTED,
          summary,
        }),
      );
    case PENDING_LOCAL_CHANGE_STATUS.COUNT_UNAVAILABLE:
      return create_some_option(
        block_restore({
          type: STORAGE_BACKUP_RESTORE_EVENT.LOCAL_CHANGE_CHECK_FAILED,
          summary,
        }),
      );
    case PENDING_LOCAL_CHANGE_STATUS.NO_PENDING_LOCAL_CHANGES:
      return create_none_option();
  }
}

export async function evaluate_restore_guards(
  dependencies: StorageBackupCoordinatorDependencies,
  prepared_restore: PreparedStorageBackupRestore,
): Promise<RestoreGuardState> {
  const pending_guard = evaluate_pending_local_change_guard(
    await dependencies.pending_local_change_state_port.get_pending_local_change_state(),
    prepared_restore.summary,
  );

  if (pending_guard.status === OptionStatus.SOME) {
    return pending_guard.value;
  }

  const safety = await dependencies.evaluate_restore_safety(
    prepared_restore.envelope.metadata.session_sync_marker_state,
  );

  return is_recoverable_session_sync_marker_safety_blocking(safety)
    ? {
        status: RESTORE_GUARD_STATUS.BLOCKED,
        event: {
          type: STORAGE_BACKUP_RESTORE_EVENT.SESSION_MISMATCH_DETECTED,
          summary: prepared_restore.summary,
          safety_status: safety.status,
        },
      }
    : { status: RESTORE_GUARD_STATUS.CLEAR, safety };
}

export function log_restore_blocked(
  event: StorageBackupRestoreBlockedEvent,
): boolean {
  console.warn("[StorageBackup] Restore blocked", {
    event: STORAGE_BACKUP_RESTORE_BLOCKED_EVENT,
    reason: event.type,
    source: event.summary.source,
  });
  return true;
}
