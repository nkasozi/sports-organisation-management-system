import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  TABLE_NAMES,
  type TableName,
} from "$lib/infrastructure/sync/syncTypes";

import {
  type BuildStorageBackupEnvelopeInput,
  is_storage_backup_source,
  normalize_storage_backup_table_snapshots,
  type StorageBackupMetadata,
  type StorageBackupTableSnapshot,
} from "./storageBackupFormat";
import { is_recoverable_session_sync_marker_state } from "./storageBackupMarkerValidation";
import { is_backup_raw_object } from "./storageBackupSyncBookkeepingEntries";

export const BACKUP_JSON_INVALID_ERROR = "Backup JSON is invalid";
const BACKUP_TABLE_NAMES_DUPLICATED_ERROR =
  "Backup contains duplicate table names";
const BACKUP_TABLE_NAMES_UNKNOWN_ERROR = "Backup contains unknown table names";
const BACKUP_TABLE_SNAPSHOTS_INVALID_ERROR =
  "Backup table snapshots are invalid";
const STRING_TYPE_NAME = "string";
const BOOLEAN_TYPE_NAME = "boolean";

type RawObject = Record<string, unknown>;
type ParsedTableSnapshot =
  BuildStorageBackupEnvelopeInput["table_snapshots"][number];

function parse_storage_backup_metadata(
  value: unknown,
): Result<StorageBackupMetadata> {
  if (
    !is_backup_raw_object(value) ||
    typeof value.created_at !== STRING_TYPE_NAME ||
    !is_storage_backup_source(value.source) ||
    typeof value.app_initialized !== BOOLEAN_TYPE_NAME ||
    typeof value.seeding_complete !== BOOLEAN_TYPE_NAME ||
    !is_recoverable_session_sync_marker_state(value.session_sync_marker_state)
  ) {
    return create_failure_result(BACKUP_JSON_INVALID_ERROR);
  }

  return create_success_result({
    created_at: value.created_at as string,
    source: value.source,
    app_initialized: value.app_initialized as boolean,
    seeding_complete: value.seeding_complete as boolean,
    session_sync_marker_state: value.session_sync_marker_state,
  });
}

function parse_storage_backup_table_snapshot(
  raw_snapshot: unknown,
  seen_table_names: Set<TableName>,
): Result<ParsedTableSnapshot> {
  if (!is_backup_raw_object(raw_snapshot)) {
    return create_failure_result(BACKUP_TABLE_SNAPSHOTS_INVALID_ERROR);
  }

  const table_name = raw_snapshot.table_name as TableName;

  if (!TABLE_NAMES.includes(table_name)) {
    return create_failure_result(BACKUP_TABLE_NAMES_UNKNOWN_ERROR);
  }

  if (seen_table_names.has(table_name)) {
    return create_failure_result(BACKUP_TABLE_NAMES_DUPLICATED_ERROR);
  }

  if (!Array.isArray(raw_snapshot.records)) {
    return create_failure_result(BACKUP_TABLE_SNAPSHOTS_INVALID_ERROR);
  }

  return create_success_result({
    table_name,
    records: raw_snapshot.records as RawObject[],
  });
}

function parse_storage_backup_table_snapshots(
  value: unknown,
): Result<StorageBackupTableSnapshot[]> {
  if (!Array.isArray(value)) {
    return create_failure_result(BACKUP_TABLE_SNAPSHOTS_INVALID_ERROR);
  }

  const seen_table_names = new Set<TableName>();
  const parsed_snapshots: ParsedTableSnapshot[] = [];

  for (const raw_snapshot of value as unknown[]) {
    const snapshot_result = parse_storage_backup_table_snapshot(
      raw_snapshot,
      seen_table_names,
    );

    if (!snapshot_result.success) {
      return snapshot_result;
    }

    seen_table_names.add(snapshot_result.data.table_name);
    parsed_snapshots.push(snapshot_result.data);
  }

  return create_success_result(
    normalize_storage_backup_table_snapshots(parsed_snapshots),
  );
}

export function parse_storage_backup_envelope_content(
  parsed_backup: RawObject,
): Result<{
  metadata: StorageBackupMetadata;
  table_snapshots: StorageBackupTableSnapshot[];
}> {
  const metadata_result = parse_storage_backup_metadata(parsed_backup.metadata);

  if (!metadata_result.success) {
    return metadata_result;
  }

  const table_snapshots_result = parse_storage_backup_table_snapshots(
    parsed_backup.table_snapshots,
  );

  if (!table_snapshots_result.success) {
    return table_snapshots_result;
  }

  return create_success_result({
    metadata: metadata_result.data,
    table_snapshots: table_snapshots_result.data,
  });
}
