import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import { is_recoverable_session_sync_marker_safety_blocking } from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  DeviceBackupDeleteState,
  DeviceBackupWriteOutcome,
  StorageBackupCoordinatorDependencies,
} from "./storageBackupContracts";
import { serialize_storage_backup_envelope } from "./storageBackupFormat";
import { STORAGE_BACKUP_USER_MESSAGES } from "./storageBackupMessages";
import {
  DEVICE_BACKUP_CAPABILITY_STATUS,
  DEVICE_BACKUP_WRITE_STATUS,
  STORAGE_BACKUP_SOURCE,
} from "./storageBackupStatus";
import {
  build_current_storage_backup_envelope,
  create_storage_backup_summary,
} from "./storageBackupSummary";

const DEVICE_BACKUP_WRITE_FAILED_EVENT = "device_backup_write_failed";
const DEVICE_BACKUP_WRITE_SKIPPED_EVENT = "device_backup_write_skipped";
const DEVICE_BACKUP_DELETE_COMPLETED_EVENT = "device_backup_delete_completed";

const DEVICE_BACKUP_WRITER_CLOSED_EVENT = "device_backup_writer_closed";

const DEVICE_BACKUP_WRITER_STATUS = {
  ACCEPTING: "accepting",
  CLOSED: "closed",
} as const;

interface DeviceBackupWriterState {
  status: (typeof DEVICE_BACKUP_WRITER_STATUS)[keyof typeof DEVICE_BACKUP_WRITER_STATUS];
  write_chain_tail: Promise<boolean>;
}

interface DeviceBackupWriter {
  write_device_backup(): AsyncResult<DeviceBackupWriteOutcome>;
  delete_device_backup(): Promise<DeviceBackupDeleteState>;
}

async function perform_device_backup_write(
  dependencies: StorageBackupCoordinatorDependencies,
): AsyncResult<DeviceBackupWriteOutcome> {
  const envelope = await build_current_storage_backup_envelope(
    dependencies,
    STORAGE_BACKUP_SOURCE.DEVICE_AUTOMATIC,
  );
  const safety = await dependencies.evaluate_restore_safety(
    envelope.metadata.session_sync_marker_state,
  );

  if (is_recoverable_session_sync_marker_safety_blocking(safety)) {
    console.log("[StorageBackup] Device backup write skipped", {
      event: DEVICE_BACKUP_WRITE_SKIPPED_EVENT,
      reason: safety.status,
    });
    return create_success_result({
      status: DEVICE_BACKUP_WRITE_STATUS.SKIPPED_NOT_RESTORABLE,
      safety_status: safety.status,
    });
  }

  const write_result =
    await dependencies.device_backup_storage_port.write_backup_json(
      serialize_storage_backup_envelope(envelope),
    );

  if (!write_result.success) {
    return write_result;
  }

  return create_success_result({
    status: DEVICE_BACKUP_WRITE_STATUS.WRITTEN,
    summary: create_storage_backup_summary(envelope),
  });
}

async function perform_device_backup_write_safely(
  dependencies: StorageBackupCoordinatorDependencies,
): AsyncResult<DeviceBackupWriteOutcome> {
  try {
    return await perform_device_backup_write(dependencies);
  } catch (error) {
    console.error("[StorageBackup] Device backup write failed", {
      event: DEVICE_BACKUP_WRITE_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(
      STORAGE_BACKUP_USER_MESSAGES.DEVICE_BACKUP_WRITE_FAILED,
    );
  }
}

function is_device_backup_supported(
  dependencies: StorageBackupCoordinatorDependencies,
): boolean {
  return (
    dependencies.device_backup_storage_port.get_capability().status ===
    DEVICE_BACKUP_CAPABILITY_STATUS.SUPPORTED
  );
}

function create_writer_closed_outcome(): Result<DeviceBackupWriteOutcome> {
  return create_success_result({
    status: DEVICE_BACKUP_WRITE_STATUS.SKIPPED_WRITER_CLOSED,
  });
}

interface DeviceBackupWriterCell {
  state: DeviceBackupWriterState;
}

function enqueue_device_backup_write(
  dependencies: StorageBackupCoordinatorDependencies,
  writer_cell: DeviceBackupWriterCell,
): AsyncResult<DeviceBackupWriteOutcome> {
  if (!is_device_backup_supported(dependencies))
    return Promise.resolve(
      create_failure_result(
        STORAGE_BACKUP_USER_MESSAGES.DEVICE_BACKUP_UNSUPPORTED,
      ),
    );
  if (writer_cell.state.status === DEVICE_BACKUP_WRITER_STATUS.CLOSED)
    return Promise.resolve(create_writer_closed_outcome());
  const queued_write = writer_cell.state.write_chain_tail.then(
    (): AsyncResult<DeviceBackupWriteOutcome> =>
      writer_cell.state.status === DEVICE_BACKUP_WRITER_STATUS.CLOSED
        ? Promise.resolve(create_writer_closed_outcome())
        : perform_device_backup_write_safely(dependencies),
  );
  writer_cell.state = {
    ...writer_cell.state,
    write_chain_tail: queued_write.then((): boolean => true),
  };
  return queued_write;
}

async function close_writer_and_delete_backup(
  dependencies: StorageBackupCoordinatorDependencies,
  writer_cell: DeviceBackupWriterCell,
): Promise<DeviceBackupDeleteState> {
  writer_cell.state = {
    ...writer_cell.state,
    status: DEVICE_BACKUP_WRITER_STATUS.CLOSED,
  };
  console.log("[StorageBackup] Device backup writer closed", {
    event: DEVICE_BACKUP_WRITER_CLOSED_EVENT,
  });
  await writer_cell.state.write_chain_tail;
  const delete_state =
    await dependencies.device_backup_storage_port.delete_backup();
  console.log("[StorageBackup] Device backup delete completed", {
    event: DEVICE_BACKUP_DELETE_COMPLETED_EVENT,
    status: delete_state.status,
  });
  return delete_state;
}

export function create_device_backup_writer(
  dependencies: StorageBackupCoordinatorDependencies,
): DeviceBackupWriter {
  const writer_cell: DeviceBackupWriterCell = {
    state: {
      status: DEVICE_BACKUP_WRITER_STATUS.ACCEPTING,
      write_chain_tail: Promise.resolve(true),
    },
  };

  return {
    write_device_backup: () =>
      enqueue_device_backup_write(dependencies, writer_cell),
    delete_device_backup: () =>
      close_writer_and_delete_backup(dependencies, writer_cell),
  };
}
