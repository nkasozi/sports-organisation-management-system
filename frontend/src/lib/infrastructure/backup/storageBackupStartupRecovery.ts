import { is_recoverable_session_sync_marker_safety_blocking } from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  PreparedStorageBackupRestore,
  StorageBackupCoordinatorDependencies,
  StorageStartupRecoveryState,
} from "./storageBackupContracts";
import {
  DEVICE_BACKUP_READ_STATUS,
  STORAGE_STARTUP_RECOVERY_STATUS,
} from "./storageBackupStatus";
import { parse_and_validate_storage_backup } from "./storageBackupSummary";

const STORAGE_BACKUP_LOCAL_PROBE_FAILED_EVENT =
  "storage_backup_local_probe_failed";

const LOCAL_DATABASE_PROBE_STATUS = {
  EMPTY: "empty",
  HAS_RECORDS: "has_records",
  UNREADABLE: "unreadable",
} as const;

type LocalDatabaseProbeStatus =
  (typeof LOCAL_DATABASE_PROBE_STATUS)[keyof typeof LOCAL_DATABASE_PROBE_STATUS];

async function probe_local_database(
  dependencies: StorageBackupCoordinatorDependencies,
): Promise<LocalDatabaseProbeStatus> {
  try {
    const total_record_count =
      await dependencies.database_port.get_total_record_count();

    return total_record_count > 0
      ? LOCAL_DATABASE_PROBE_STATUS.HAS_RECORDS
      : LOCAL_DATABASE_PROBE_STATUS.EMPTY;
  } catch (error) {
    console.warn("[StorageBackup] Local database probe failed", {
      event: STORAGE_BACKUP_LOCAL_PROBE_FAILED_EVENT,
      error: String(error),
    });
    return LOCAL_DATABASE_PROBE_STATUS.UNREADABLE;
  }
}

async function classify_valid_device_backup(
  dependencies: StorageBackupCoordinatorDependencies,
  prepared_restore: PreparedStorageBackupRestore,
): Promise<StorageStartupRecoveryState> {
  const safety = await dependencies.evaluate_restore_safety(
    prepared_restore.summary.session_sync_marker_state,
  );

  return is_recoverable_session_sync_marker_safety_blocking(safety)
    ? {
        status: STORAGE_STARTUP_RECOVERY_STATUS.RESTORE_BLOCKED,
        summary: prepared_restore.summary,
        safety_status: safety.status,
      }
    : {
        status: STORAGE_STARTUP_RECOVERY_STATUS.RESTORE_AVAILABLE,
        summary: prepared_restore.summary,
      };
}

async function classify_available_device_backup(
  dependencies: StorageBackupCoordinatorDependencies,
  serialized_backup: string,
): Promise<StorageStartupRecoveryState> {
  const probe_status = await probe_local_database(dependencies);

  if (probe_status === LOCAL_DATABASE_PROBE_STATUS.HAS_RECORDS) {
    return { status: STORAGE_STARTUP_RECOVERY_STATUS.LOCAL_DATA_PRESENT };
  }

  const prepared_result = parse_and_validate_storage_backup(serialized_backup);

  if (!prepared_result.success) {
    return {
      status: STORAGE_STARTUP_RECOVERY_STATUS.INVALID_DEVICE_BACKUP,
      error: prepared_result.error,
    };
  }

  return classify_valid_device_backup(dependencies, prepared_result.data);
}

export async function evaluate_storage_startup_recovery(
  dependencies: StorageBackupCoordinatorDependencies,
): Promise<StorageStartupRecoveryState> {
  const read_state =
    await dependencies.device_backup_storage_port.read_backup_json();

  switch (read_state.status) {
    case DEVICE_BACKUP_READ_STATUS.UNSUPPORTED:
      return {
        status: STORAGE_STARTUP_RECOVERY_STATUS.DEVICE_BACKUP_UNSUPPORTED,
      };
    case DEVICE_BACKUP_READ_STATUS.MISSING:
      return { status: STORAGE_STARTUP_RECOVERY_STATUS.BACKUP_MISSING };
    case DEVICE_BACKUP_READ_STATUS.FAILED:
      return {
        status: STORAGE_STARTUP_RECOVERY_STATUS.DEVICE_BACKUP_READ_FAILED,
        error: read_state.error,
      };
    case DEVICE_BACKUP_READ_STATUS.AVAILABLE:
      return classify_available_device_backup(
        dependencies,
        read_state.serialized_backup,
      );
  }
}
