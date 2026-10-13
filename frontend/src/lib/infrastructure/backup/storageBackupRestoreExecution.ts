import type { AsyncResult } from "$lib/core/types/Result";
import {
  type RecoverableSessionSyncMarkerSafety,
  resolve_restored_session_sync_marker_state,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  PreparedStorageBackupRestore,
  ReplaceAllTablesAtomicallyCommand,
  StorageBackupCoordinatorDependencies,
} from "./storageBackupContracts";
import { STORAGE_BACKUP_USER_MESSAGES } from "./storageBackupMessages";
import {
  evaluate_restore_guards,
  log_restore_blocked,
  RESTORE_GUARD_STATUS,
} from "./storageBackupRestoreGuards";
import {
  STORAGE_BACKUP_RESTORE_EVENT,
  type StorageBackupPreparationEvent,
  type StorageBackupRestoreOutcomeEvent,
} from "./storageBackupRestoreTypes";
import { parse_and_validate_storage_backup } from "./storageBackupSummary";
import { resolve_restorable_sync_bookkeeping } from "./storageBackupSyncBookkeepingRestore";
import {
  resume_sync_after_restore,
  suspend_sync_for_restore,
} from "./storageBackupSyncSuspension";

const STORAGE_BACKUP_VALIDATION_FAILED_EVENT =
  "storage_backup_validation_failed";
const STORAGE_BACKUP_RESTORE_STARTED_EVENT = "storage_backup_restore_started";
const STORAGE_BACKUP_RESTORE_FAILED_EVENT = "storage_backup_restore_failed";
const STORAGE_BACKUP_RESTORE_SUCCEEDED_EVENT =
  "storage_backup_restore_succeeded";

export async function prepare_storage_backup_restore(
  dependencies: StorageBackupCoordinatorDependencies,
  serialized_backup: string,
): Promise<StorageBackupPreparationEvent> {
  const prepared_result = parse_and_validate_storage_backup(serialized_backup);

  if (!prepared_result.success) {
    console.warn("[StorageBackup] Backup validation failed", {
      event: STORAGE_BACKUP_VALIDATION_FAILED_EVENT,
      error: prepared_result.error,
    });
    return {
      type: STORAGE_BACKUP_RESTORE_EVENT.VALIDATION_FAILED,
      error: prepared_result.error,
    };
  }

  const guard_state = await evaluate_restore_guards(
    dependencies,
    prepared_result.data,
  );

  if (guard_state.status === RESTORE_GUARD_STATUS.BLOCKED) {
    log_restore_blocked(guard_state.event);
    return guard_state.event;
  }

  return {
    type: STORAGE_BACKUP_RESTORE_EVENT.VALIDATION_PASSED,
    prepared_restore: prepared_result.data,
  };
}

function build_restore_command(
  dependencies: StorageBackupCoordinatorDependencies,
  prepared_restore: PreparedStorageBackupRestore,
  safety: RecoverableSessionSyncMarkerSafety,
): ReplaceAllTablesAtomicallyCommand {
  const metadata = prepared_restore.envelope.metadata;
  const restored_marker_state = resolve_restored_session_sync_marker_state(
    metadata.session_sync_marker_state,
    safety,
  );

  return {
    table_snapshots: prepared_restore.validated_table_snapshots,
    sync_bookkeeping: resolve_restorable_sync_bookkeeping(
      prepared_restore.envelope,
    ),
    persist_settings_within_transaction: async (): Promise<boolean> => {
      const bootstrap_state_persisted =
        await dependencies.bootstrap_state_port.persist_bootstrap_state({
          app_initialized: metadata.app_initialized,
          seeding_complete: metadata.seeding_complete,
        });
      if (!bootstrap_state_persisted) return false;
      return dependencies.persist_session_sync_marker_state(
        restored_marker_state,
      );
    },
  };
}

async function replace_tables_with_sync_suspended(
  dependencies: StorageBackupCoordinatorDependencies,
  prepared_restore: PreparedStorageBackupRestore,
  safety: RecoverableSessionSyncMarkerSafety,
): AsyncResult<boolean> {
  console.log("[StorageBackup] Restore started", {
    event: STORAGE_BACKUP_RESTORE_STARTED_EVENT,
    source: prepared_restore.summary.source,
    total_records: prepared_restore.summary.total_records,
  });
  const suspension_state = suspend_sync_for_restore(
    dependencies.sync_suspension_port,
  );
  const replace_result =
    await dependencies.database_port.replace_all_tables_atomically(
      build_restore_command(dependencies, prepared_restore, safety),
    );
  resume_sync_after_restore(
    dependencies.sync_suspension_port,
    suspension_state,
  );
  return replace_result;
}

export async function restore_prepared_storage_backup(
  dependencies: StorageBackupCoordinatorDependencies,
  prepared_restore: PreparedStorageBackupRestore,
): Promise<StorageBackupRestoreOutcomeEvent> {
  const guard_state = await evaluate_restore_guards(
    dependencies,
    prepared_restore,
  );

  if (guard_state.status === RESTORE_GUARD_STATUS.BLOCKED) {
    log_restore_blocked(guard_state.event);
    return guard_state.event;
  }

  const replace_result = await replace_tables_with_sync_suspended(
    dependencies,
    prepared_restore,
    guard_state.safety,
  );

  if (!replace_result.success) {
    console.error("[StorageBackup] Restore failed", {
      event: STORAGE_BACKUP_RESTORE_FAILED_EVENT,
      error: replace_result.error,
    });
    return {
      type: STORAGE_BACKUP_RESTORE_EVENT.RESTORE_FAILED,
      error: STORAGE_BACKUP_USER_MESSAGES.RESTORE_FAILED,
    };
  }

  console.log("[StorageBackup] Restore succeeded", {
    event: STORAGE_BACKUP_RESTORE_SUCCEEDED_EVENT,
    total_records: prepared_restore.summary.total_records,
  });
  return {
    type: STORAGE_BACKUP_RESTORE_EVENT.RESTORE_SUCCEEDED,
    summary: prepared_restore.summary,
  };
}
