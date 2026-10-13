import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import type {
  DeviceBackupDeleteState,
  DeviceBackupReadState,
  DeviceBackupStoragePort,
} from "./storageBackupContracts";
import { STORAGE_BACKUP_USER_MESSAGES } from "./storageBackupMessages";
import {
  DEVICE_BACKUP_CAPABILITY_STATUS,
  DEVICE_BACKUP_DELETE_STATUS,
  DEVICE_BACKUP_READ_STATUS,
} from "./storageBackupStatus";

export const DEVICE_BACKUP_FILE_NAME = "sports-org-device-backup.json";

const MESSAGES = STORAGE_BACKUP_USER_MESSAGES;
const DEVICE_BACKUP_READ_FAILED_EVENT = "device_backup_read_failed";
const DEVICE_BACKUP_WRITE_FAILED_EVENT = "device_backup_write_failed";
const DEVICE_BACKUP_DELETE_FAILED_EVENT = "device_backup_delete_failed";
const FILE_NOT_FOUND_ERROR_NAME = "NotFoundError";
const FUNCTION_TYPE_NAME = "function";
const UNDEFINED_TYPE_NAME = "undefined";

export type DeviceBackupDirectoryAccess =
  | {
      status: typeof DEVICE_BACKUP_CAPABILITY_STATUS.SUPPORTED;
      get_directory: () => Promise<FileSystemDirectoryHandle>;
    }
  | { status: typeof DEVICE_BACKUP_CAPABILITY_STATUS.UNSUPPORTED };

function is_file_not_found_error(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === FILE_NOT_FOUND_ERROR_NAME
  );
}

export function get_navigator_device_backup_directory_access(): DeviceBackupDirectoryAccess {
  if (typeof navigator === UNDEFINED_TYPE_NAME || !navigator.storage) {
    return { status: DEVICE_BACKUP_CAPABILITY_STATUS.UNSUPPORTED };
  }

  const storage_manager = navigator.storage;

  if (typeof storage_manager.getDirectory !== FUNCTION_TYPE_NAME) {
    return { status: DEVICE_BACKUP_CAPABILITY_STATUS.UNSUPPORTED };
  }

  return {
    status: DEVICE_BACKUP_CAPABILITY_STATUS.SUPPORTED,
    get_directory: () => storage_manager.getDirectory(),
  };
}

async function read_backup_file(
  get_directory: () => Promise<FileSystemDirectoryHandle>,
): Promise<DeviceBackupReadState> {
  try {
    const directory = await get_directory();
    const file_handle = await directory.getFileHandle(DEVICE_BACKUP_FILE_NAME);
    const file = await file_handle.getFile();
    return {
      status: DEVICE_BACKUP_READ_STATUS.AVAILABLE,
      serialized_backup: await file.text(),
    };
  } catch (error) {
    if (is_file_not_found_error(error)) {
      return { status: DEVICE_BACKUP_READ_STATUS.MISSING };
    }

    console.error("[StorageBackup] Device backup read failed", {
      event: DEVICE_BACKUP_READ_FAILED_EVENT,
      error: String(error),
    });
    return {
      status: DEVICE_BACKUP_READ_STATUS.FAILED,
      error: MESSAGES.DEVICE_BACKUP_READ_FAILED,
    };
  }
}

async function write_backup_file(
  get_directory: () => Promise<FileSystemDirectoryHandle>,
  serialized_backup: string,
): AsyncResult<boolean> {
  try {
    const directory = await get_directory();
    const file_handle = await directory.getFileHandle(DEVICE_BACKUP_FILE_NAME, {
      create: true,
    });
    const writable = await file_handle.createWritable();
    await writable.write(serialized_backup);
    await writable.close();
    return create_success_result(true);
  } catch (error) {
    console.error("[StorageBackup] Device backup write failed", {
      event: DEVICE_BACKUP_WRITE_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(MESSAGES.DEVICE_BACKUP_WRITE_FAILED);
  }
}

async function delete_backup_file(
  get_directory: () => Promise<FileSystemDirectoryHandle>,
): Promise<DeviceBackupDeleteState> {
  try {
    const directory = await get_directory();
    await directory.removeEntry(DEVICE_BACKUP_FILE_NAME);
    return { status: DEVICE_BACKUP_DELETE_STATUS.DELETED };
  } catch (error) {
    if (is_file_not_found_error(error)) {
      return { status: DEVICE_BACKUP_DELETE_STATUS.ALREADY_MISSING };
    }

    console.error("[StorageBackup] Device backup delete failed", {
      event: DEVICE_BACKUP_DELETE_FAILED_EVENT,
      error: String(error),
    });
    return {
      status: DEVICE_BACKUP_DELETE_STATUS.FAILED,
      error: MESSAGES.DEVICE_BACKUP_DELETE_FAILED,
    };
  }
}

export function create_device_backup_storage_port(
  get_directory_access: () => DeviceBackupDirectoryAccess,
): DeviceBackupStoragePort {
  return {
    get_capability: () => ({ status: get_directory_access().status }),
    read_backup_json: async () => {
      const directory_access = get_directory_access();
      return directory_access.status ===
        DEVICE_BACKUP_CAPABILITY_STATUS.SUPPORTED
        ? read_backup_file(directory_access.get_directory)
        : { status: DEVICE_BACKUP_READ_STATUS.UNSUPPORTED };
    },
    write_backup_json: async (serialized_backup: string) => {
      const directory_access = get_directory_access();
      return directory_access.status ===
        DEVICE_BACKUP_CAPABILITY_STATUS.SUPPORTED
        ? write_backup_file(directory_access.get_directory, serialized_backup)
        : create_failure_result(MESSAGES.DEVICE_BACKUP_UNSUPPORTED);
    },
    delete_backup: async () => {
      const directory_access = get_directory_access();
      return directory_access.status ===
        DEVICE_BACKUP_CAPABILITY_STATUS.SUPPORTED
        ? delete_backup_file(directory_access.get_directory)
        : { status: DEVICE_BACKUP_DELETE_STATUS.UNSUPPORTED };
    },
  };
}
