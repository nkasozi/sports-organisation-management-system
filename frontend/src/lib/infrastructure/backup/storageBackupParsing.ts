import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  BACKUP_JSON_INVALID_ERROR,
  parse_storage_backup_envelope_content,
} from "./storageBackupContentParsing";
import {
  LEGACY_STORAGE_BACKUP_FORMAT_VERSION,
  STORAGE_BACKUP_FORMAT_VERSION,
  type StorageBackupEnvelope,
} from "./storageBackupFormat";
import { parse_storage_backup_sync_bookkeeping } from "./storageBackupSyncBookkeeping";
import { is_backup_raw_object } from "./storageBackupSyncBookkeepingEntries";

const BACKUP_FORMAT_UNSUPPORTED_ERROR = "Backup format version is unsupported";
const STORAGE_BACKUP_JSON_PARSE_FAILED_EVENT =
  "storage_backup_json_parse_failed";

type RawObject = Record<string, unknown>;

function parse_json_object(serialized_backup: string): Result<RawObject> {
  try {
    const parsed_value: unknown = JSON.parse(serialized_backup);

    return is_backup_raw_object(parsed_value)
      ? create_success_result(parsed_value)
      : create_failure_result(BACKUP_JSON_INVALID_ERROR);
  } catch (error) {
    console.warn("[StorageBackup] Backup JSON parse failed", {
      event: STORAGE_BACKUP_JSON_PARSE_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(BACKUP_JSON_INVALID_ERROR);
  }
}

function parse_current_storage_backup_envelope(
  parsed_backup: RawObject,
): Result<StorageBackupEnvelope> {
  const content_result = parse_storage_backup_envelope_content(parsed_backup);

  if (!content_result.success) {
    return content_result;
  }

  const bookkeeping_result = parse_storage_backup_sync_bookkeeping(
    parsed_backup.sync_bookkeeping,
  );

  if (!bookkeeping_result.success) {
    return bookkeeping_result;
  }

  return create_success_result({
    format_version: STORAGE_BACKUP_FORMAT_VERSION,
    ...content_result.data,
    sync_bookkeeping: bookkeeping_result.data,
  });
}

function parse_legacy_storage_backup_envelope(
  parsed_backup: RawObject,
): Result<StorageBackupEnvelope> {
  const content_result = parse_storage_backup_envelope_content(parsed_backup);

  if (!content_result.success) {
    return content_result;
  }

  return create_success_result({
    format_version: LEGACY_STORAGE_BACKUP_FORMAT_VERSION,
    ...content_result.data,
  });
}

export function parse_storage_backup_envelope_json(
  serialized_backup: string,
): Result<StorageBackupEnvelope> {
  const parsed_backup_result = parse_json_object(serialized_backup);

  if (!parsed_backup_result.success) {
    return parsed_backup_result;
  }

  switch (parsed_backup_result.data.format_version) {
    case STORAGE_BACKUP_FORMAT_VERSION:
      return parse_current_storage_backup_envelope(parsed_backup_result.data);
    case LEGACY_STORAGE_BACKUP_FORMAT_VERSION:
      return parse_legacy_storage_backup_envelope(parsed_backup_result.data);
    default:
      return create_failure_result(BACKUP_FORMAT_UNSUPPORTED_ERROR);
  }
}
