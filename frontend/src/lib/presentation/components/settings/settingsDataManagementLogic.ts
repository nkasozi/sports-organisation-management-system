import type { Result } from "$lib/core/types/Result";
import type { DeviceBackupCapabilityState } from "$lib/infrastructure/backup/storageBackupContracts";
import type { StorageBackupCoordinator } from "$lib/infrastructure/backup/storageBackupCoordinator";
import { transition_storage_backup_restore_state } from "$lib/infrastructure/backup/storageBackupRestoreMachine";
import {
  STORAGE_BACKUP_RESTORE_EVENT,
  STORAGE_BACKUP_RESTORE_STATUS,
  type StorageBackupRestoreEvent,
  type StorageBackupRestoreState,
} from "$lib/infrastructure/backup/storageBackupRestoreTypes";
import { DEVICE_BACKUP_CAPABILITY_STATUS } from "$lib/infrastructure/backup/storageBackupStatus";

import { announce_settled_storage_backup_import } from "./settingsDataImportSettlement";
import {
  BACKUP_EXPORT_SUCCESS_MESSAGE,
  BACKUP_FILE_UNREADABLE_ERROR,
  FILE_NAME_PREFIX,
  FILE_NAME_SUFFIX,
  type ShowToast,
  SUPPORTED_BACKUP_MESSAGE,
  TOAST_TYPE_ERROR,
  TOAST_TYPE_SUCCESS,
  UNSUPPORTED_BACKUP_MESSAGE,
} from "./settingsDataManagementMessages";

interface ExportStorageBackupCommand {
  create_manual_backup_json: StorageBackupCoordinator["create_manual_backup_json"];
  download_file: (file_name: string, serialized_backup: string) => void;
  show_toast: ShowToast;
}

type PublishStorageBackupImportState = (
  next_state: StorageBackupRestoreState,
) => boolean;

interface BeginStorageBackupImportCommand {
  current_state: StorageBackupRestoreState;
  publish_state: PublishStorageBackupImportState;
  load_serialized_backup: () => Promise<string>;
  prepare_backup_restore: StorageBackupCoordinator["prepare_backup_restore"];
}

interface ConfirmStorageBackupImportCommand {
  current_state: StorageBackupRestoreState;
  publish_state: PublishStorageBackupImportState;
  restore_prepared_backup: StorageBackupCoordinator["restore_prepared_backup"];
  show_toast: ShowToast;
  refresh_page: () => void;
}

const STORAGE_BACKUP_IMPORT_TRANSITION_REJECTED_EVENT =
  "storage_backup_import_transition_rejected";
const STORAGE_BACKUP_FILE_READ_FAILED_EVENT = "storage_backup_file_read_failed";

export function build_storage_backup_download_file_name(
  created_at: string,
): string {
  return `${FILE_NAME_PREFIX}${created_at.replace(/:/g, "-")}${FILE_NAME_SUFFIX}`;
}

export function get_storage_backup_support_message(
  capability_state: DeviceBackupCapabilityState,
): string {
  return capability_state.status === DEVICE_BACKUP_CAPABILITY_STATUS.SUPPORTED
    ? SUPPORTED_BACKUP_MESSAGE
    : UNSUPPORTED_BACKUP_MESSAGE;
}

export async function export_storage_backup_json(
  command: ExportStorageBackupCommand,
): Promise<boolean> {
  const backup_result = await command.create_manual_backup_json();

  if (!backup_result.success) {
    command.show_toast(backup_result.error, TOAST_TYPE_ERROR);
    return false;
  }

  command.download_file(
    build_storage_backup_download_file_name(
      backup_result.data.summary.created_at,
    ),
    backup_result.data.serialized_backup,
  );
  command.show_toast(BACKUP_EXPORT_SUCCESS_MESSAGE, TOAST_TYPE_SUCCESS);
  return true;
}

function try_storage_backup_import_event(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): Result<StorageBackupRestoreState> {
  const transition_result = transition_storage_backup_restore_state(
    current_state,
    event,
  );
  if (!transition_result.success)
    console.warn("[SettingsDataManagement] Import transition rejected", {
      event: STORAGE_BACKUP_IMPORT_TRANSITION_REJECTED_EVENT,
      error: transition_result.error,
    });
  return transition_result;
}

function apply_storage_backup_import_event(
  current_state: StorageBackupRestoreState,
  event: StorageBackupRestoreEvent,
): StorageBackupRestoreState {
  const transition_result = try_storage_backup_import_event(
    current_state,
    event,
  );
  return transition_result.success ? transition_result.data : current_state;
}

async function load_backup_file_event(
  command: BeginStorageBackupImportCommand,
): Promise<StorageBackupRestoreEvent> {
  try {
    const serialized_backup = await command.load_serialized_backup();
    return await command.prepare_backup_restore(serialized_backup);
  } catch (error) {
    console.warn("[SettingsDataManagement] Backup file read failed", {
      event: STORAGE_BACKUP_FILE_READ_FAILED_EVENT,
      error: String(error),
    });
    return {
      type: STORAGE_BACKUP_RESTORE_EVENT.VALIDATION_FAILED,
      error: BACKUP_FILE_UNREADABLE_ERROR,
    };
  }
}

export async function begin_storage_backup_import(
  command: BeginStorageBackupImportCommand,
): Promise<StorageBackupRestoreState> {
  const validating_result = try_storage_backup_import_event(
    command.current_state,
    { type: STORAGE_BACKUP_RESTORE_EVENT.BACKUP_SELECTED },
  );
  if (!validating_result.success) return command.current_state;
  command.publish_state(validating_result.data);
  const settled_state = apply_storage_backup_import_event(
    validating_result.data,
    await load_backup_file_event(command),
  );
  command.publish_state(settled_state);
  return settled_state;
}

export async function confirm_storage_backup_import(
  command: ConfirmStorageBackupImportCommand,
): Promise<StorageBackupRestoreState> {
  const awaiting_state = command.current_state;
  const restoring_result = try_storage_backup_import_event(awaiting_state, {
    type: STORAGE_BACKUP_RESTORE_EVENT.RESTORE_CONFIRMED,
  });
  if (
    !restoring_result.success ||
    awaiting_state.status !==
      STORAGE_BACKUP_RESTORE_STATUS.AWAITING_CONFIRMATION
  )
    return awaiting_state;
  command.publish_state(restoring_result.data);
  const settled_state = apply_storage_backup_import_event(
    restoring_result.data,
    await command.restore_prepared_backup(awaiting_state.prepared_restore),
  );
  command.publish_state(settled_state);

  return announce_settled_storage_backup_import(settled_state, command);
}

export function cancel_storage_backup_import(
  current_state: StorageBackupRestoreState,
): StorageBackupRestoreState {
  return apply_storage_backup_import_event(current_state, {
    type: STORAGE_BACKUP_RESTORE_EVENT.RESTORE_CANCELLED,
  });
}

export function dismiss_storage_backup_import(
  current_state: StorageBackupRestoreState,
): StorageBackupRestoreState {
  return apply_storage_backup_import_event(current_state, {
    type: STORAGE_BACKUP_RESTORE_EVENT.RESET,
  });
}
