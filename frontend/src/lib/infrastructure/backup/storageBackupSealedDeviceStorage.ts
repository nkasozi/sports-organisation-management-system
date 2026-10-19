import { type Option, OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import type {
  DeviceBackupReadState,
  DeviceBackupStoragePort,
} from "./storageBackupContracts";
import { STORAGE_BACKUP_USER_MESSAGES } from "./storageBackupMessages";
import { DEVICE_BACKUP_READ_STATUS } from "./storageBackupStatus";

const DEVICE_BACKUP_ASSOCIATED_DATA_LABEL = "sport-sync-device-backup";

const MESSAGES = STORAGE_BACKUP_USER_MESSAGES;
const BASE64_CHUNK_SIZE = 0x8000;
const STRING_TYPE_NAME = "string";
const DEVICE_BACKUP_UNREADABLE_EVENT = "device_backup_unreadable_ignored";
const DEVICE_BACKUP_KEY_UNAVAILABLE_EVENT = "device_backup_key_unavailable";
const DEVICE_BACKUP_SEAL_FAILED_EVENT = "device_backup_seal_failed";
const BASE64_DECODE_FAILED = "Backup file is not valid base64";
const BACKUP_CONTENT_NOT_TEXT = "Backup content is not text";

interface DeviceBackupSealingPort {
  current_data_key(): Option<Uint8Array>;
  seal(
    data_key: Uint8Array,
    value: unknown,
    associated_data: Uint8Array,
  ): Result<Uint8Array>;
  open(
    data_key: Uint8Array,
    sealed: Uint8Array,
    associated_data: Uint8Array,
  ): Result<unknown>;
}

function encode_bytes_as_base64(bytes: Uint8Array): string {
  const characters: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + BASE64_CHUNK_SIZE);
    characters.push(String.fromCharCode(...chunk));
  }
  return btoa(characters.join(""));
}

function decode_base64_to_bytes(text: string): Result<Uint8Array> {
  try {
    const binary = atob(text.trim());
    return create_success_result(
      Uint8Array.from(binary, (character: string) => character.charCodeAt(0)),
    );
  } catch (error) {
    console.warn("[StorageBackup] Device backup is not sealed base64", {
      event: DEVICE_BACKUP_UNREADABLE_EVENT,
      error: String(error),
    });
    return create_failure_result(BASE64_DECODE_FAILED);
  }
}

function read_associated_data(): Uint8Array {
  return new TextEncoder().encode(DEVICE_BACKUP_ASSOCIATED_DATA_LABEL);
}

function open_sealed_backup_text(
  sealing: DeviceBackupSealingPort,
  data_key: Uint8Array,
  sealed_text: string,
): Result<string> {
  const sealed = decode_base64_to_bytes(sealed_text);
  if (!sealed.success) return sealed;
  const opened = sealing.open(data_key, sealed.data, read_associated_data());
  if (!opened.success) return opened;
  return typeof opened.data === STRING_TYPE_NAME
    ? create_success_result(opened.data as string)
    : create_failure_result(BACKUP_CONTENT_NOT_TEXT);
}

function report_key_unavailable(): boolean {
  console.error("[StorageBackup] No local data key for the device backup", {
    event: DEVICE_BACKUP_KEY_UNAVAILABLE_EVENT,
  });
  return true;
}

async function read_sealed_backup(
  inner: DeviceBackupStoragePort,
  sealing: DeviceBackupSealingPort,
): Promise<DeviceBackupReadState> {
  const read_state = await inner.read_backup_json();
  if (read_state.status !== DEVICE_BACKUP_READ_STATUS.AVAILABLE)
    return read_state;
  const data_key = sealing.current_data_key();
  if (data_key.status !== OptionStatus.SOME) {
    report_key_unavailable();
    return {
      status: DEVICE_BACKUP_READ_STATUS.FAILED,
      error: MESSAGES.DEVICE_BACKUP_READ_FAILED,
    };
  }
  const opened = open_sealed_backup_text(
    sealing,
    data_key.value,
    read_state.serialized_backup,
  );
  if (opened.success)
    return {
      status: DEVICE_BACKUP_READ_STATUS.AVAILABLE,
      serialized_backup: opened.data,
    };
  console.warn(
    "[StorageBackup] Device backup could not be opened, ignoring it",
    {
      event: DEVICE_BACKUP_UNREADABLE_EVENT,
      error: opened.error,
    },
  );
  return { status: DEVICE_BACKUP_READ_STATUS.MISSING };
}

async function write_sealed_backup(
  inner: DeviceBackupStoragePort,
  sealing: DeviceBackupSealingPort,
  serialized_backup: string,
): AsyncResult<boolean> {
  const data_key = sealing.current_data_key();
  if (data_key.status !== OptionStatus.SOME) {
    report_key_unavailable();
    return create_failure_result(MESSAGES.DEVICE_BACKUP_WRITE_FAILED);
  }
  const sealed = sealing.seal(
    data_key.value,
    serialized_backup,
    read_associated_data(),
  );
  if (!sealed.success) {
    console.error("[StorageBackup] Device backup could not be sealed", {
      event: DEVICE_BACKUP_SEAL_FAILED_EVENT,
      error: sealed.error,
    });
    return create_failure_result(MESSAGES.DEVICE_BACKUP_WRITE_FAILED);
  }
  return inner.write_backup_json(encode_bytes_as_base64(sealed.data));
}

export function create_sealed_device_backup_storage_port(
  inner: DeviceBackupStoragePort,
  sealing: DeviceBackupSealingPort,
): DeviceBackupStoragePort {
  return {
    get_capability: () => inner.get_capability(),
    read_backup_json: () => read_sealed_backup(inner, sealing),
    write_backup_json: (serialized_backup: string) =>
      write_sealed_backup(inner, sealing, serialized_backup),
    delete_backup: () => inner.delete_backup(),
  };
}
