import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import type {
  DeviceBackupCapabilityState,
  DeviceBackupDeleteState,
  DeviceBackupWriteOutcome,
  PreparedStorageBackupRestore,
  StorageBackupCoordinatorDependencies,
  StorageBackupSummary,
  StorageStartupRecoveryState,
} from "./storageBackupContracts";
import { create_device_backup_writer } from "./storageBackupDeviceWrites";
import { serialize_storage_backup_envelope } from "./storageBackupFormat";
import { STORAGE_BACKUP_USER_MESSAGES } from "./storageBackupMessages";
import {
  prepare_storage_backup_restore,
  restore_prepared_storage_backup,
} from "./storageBackupRestoreExecution";
import {
  STORAGE_BACKUP_RESTORE_EVENT,
  type StorageBackupPreparationEvent,
  type StorageBackupRestoreOutcomeEvent,
} from "./storageBackupRestoreTypes";
import { evaluate_storage_startup_recovery } from "./storageBackupStartupRecovery";
import {
  DEVICE_BACKUP_READ_STATUS,
  STORAGE_BACKUP_SOURCE,
} from "./storageBackupStatus";
import {
  build_current_storage_backup_envelope,
  create_storage_backup_summary,
} from "./storageBackupSummary";

const MESSAGES = STORAGE_BACKUP_USER_MESSAGES;
const STORAGE_BACKUP_EXPORT_FAILED_EVENT = "storage_backup_export_failed";

export interface StorageBackupCoordinator {
  get_device_backup_capability(): DeviceBackupCapabilityState;
  create_manual_backup_json(): AsyncResult<{
    serialized_backup: string;
    summary: StorageBackupSummary;
  }>;
  write_device_backup(): AsyncResult<DeviceBackupWriteOutcome>;
  delete_device_backup(): Promise<DeviceBackupDeleteState>;
  prepare_backup_restore(
    serialized_backup: string,
  ): Promise<StorageBackupPreparationEvent>;
  restore_prepared_backup(
    prepared_restore: PreparedStorageBackupRestore,
  ): Promise<StorageBackupRestoreOutcomeEvent>;
  restore_from_device_backup(): AsyncResult<StorageBackupSummary>;
  evaluate_startup_recovery(): Promise<StorageStartupRecoveryState>;
}

type UnsuccessfulStorageBackupRestoreEvent = Exclude<
  StorageBackupPreparationEvent | StorageBackupRestoreOutcomeEvent,
  | { type: typeof STORAGE_BACKUP_RESTORE_EVENT.VALIDATION_PASSED }
  | { type: typeof STORAGE_BACKUP_RESTORE_EVENT.RESTORE_SUCCEEDED }
>;

function convert_unsuccessful_restore_event_to_failure(
  event: UnsuccessfulStorageBackupRestoreEvent,
): Result<never> {
  switch (event.type) {
    case STORAGE_BACKUP_RESTORE_EVENT.PENDING_LOCAL_CHANGES_DETECTED:
      return create_failure_result(MESSAGES.RESTORE_BLOCKED_PENDING_CHANGES);
    case STORAGE_BACKUP_RESTORE_EVENT.SESSION_MISMATCH_DETECTED:
      return create_failure_result(MESSAGES.RESTORE_BLOCKED_SESSION);
    case STORAGE_BACKUP_RESTORE_EVENT.LOCAL_CHANGE_CHECK_FAILED:
      return create_failure_result(MESSAGES.RESTORE_BLOCKED_CHANGE_CHECK);
    case STORAGE_BACKUP_RESTORE_EVENT.VALIDATION_FAILED:
    case STORAGE_BACKUP_RESTORE_EVENT.RESTORE_FAILED:
      return create_failure_result(event.error);
  }
}

async function restore_serialized_backup(
  dependencies: StorageBackupCoordinatorDependencies,
  serialized_backup: string,
): AsyncResult<StorageBackupSummary> {
  const preparation_event = await prepare_storage_backup_restore(
    dependencies,
    serialized_backup,
  );

  if (
    preparation_event.type !== STORAGE_BACKUP_RESTORE_EVENT.VALIDATION_PASSED
  ) {
    return convert_unsuccessful_restore_event_to_failure(preparation_event);
  }

  const outcome_event = await restore_prepared_storage_backup(
    dependencies,
    preparation_event.prepared_restore,
  );

  return outcome_event.type === STORAGE_BACKUP_RESTORE_EVENT.RESTORE_SUCCEEDED
    ? create_success_result(outcome_event.summary)
    : convert_unsuccessful_restore_event_to_failure(outcome_event);
}

async function restore_from_device_backup(
  dependencies: StorageBackupCoordinatorDependencies,
): AsyncResult<StorageBackupSummary> {
  const read_state =
    await dependencies.device_backup_storage_port.read_backup_json();

  switch (read_state.status) {
    case DEVICE_BACKUP_READ_STATUS.UNSUPPORTED:
      return create_failure_result(MESSAGES.DEVICE_BACKUP_UNSUPPORTED);
    case DEVICE_BACKUP_READ_STATUS.MISSING:
      return create_failure_result(MESSAGES.DEVICE_BACKUP_MISSING);
    case DEVICE_BACKUP_READ_STATUS.FAILED:
      return create_failure_result(read_state.error);
    case DEVICE_BACKUP_READ_STATUS.AVAILABLE:
      return restore_serialized_backup(
        dependencies,
        read_state.serialized_backup,
      );
  }
}

async function create_manual_backup_json(
  dependencies: StorageBackupCoordinatorDependencies,
): AsyncResult<{ serialized_backup: string; summary: StorageBackupSummary }> {
  try {
    const envelope = await build_current_storage_backup_envelope(
      dependencies,
      STORAGE_BACKUP_SOURCE.MANUAL_EXPORT,
    );
    return create_success_result({
      serialized_backup: serialize_storage_backup_envelope(envelope),
      summary: create_storage_backup_summary(envelope),
    });
  } catch (error) {
    console.error("[StorageBackup] Export failed", {
      event: STORAGE_BACKUP_EXPORT_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(MESSAGES.BACKUP_EXPORT_FAILED);
  }
}

export function create_storage_backup_coordinator(
  dependencies: StorageBackupCoordinatorDependencies,
): StorageBackupCoordinator {
  const device_backup_writer = create_device_backup_writer(dependencies);

  return {
    get_device_backup_capability: () =>
      dependencies.device_backup_storage_port.get_capability(),
    create_manual_backup_json: () => create_manual_backup_json(dependencies),
    write_device_backup: () => device_backup_writer.write_device_backup(),
    delete_device_backup: () => device_backup_writer.delete_device_backup(),
    prepare_backup_restore: (serialized_backup: string) =>
      prepare_storage_backup_restore(dependencies, serialized_backup),
    restore_prepared_backup: (prepared_restore: PreparedStorageBackupRestore) =>
      restore_prepared_storage_backup(dependencies, prepared_restore),
    restore_from_device_backup: () => restore_from_device_backup(dependencies),
    evaluate_startup_recovery: () =>
      evaluate_storage_startup_recovery(dependencies),
  };
}
