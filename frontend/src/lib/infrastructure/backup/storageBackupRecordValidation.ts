import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import type { TableName } from "$lib/infrastructure/sync/syncTypes";

import type { StorageBackupTableSnapshot } from "./storageBackupFormat";

export const MAXIMUM_STORAGE_BACKUP_TOTAL_RECORDS = 250000;

const BACKUP_RECORD_COUNT_EXCEEDED_ERROR =
  "Backup exceeds the maximum supported record count";
const BACKUP_RECORD_NOT_OBJECT_ERROR =
  "Backup contains a record that is not an object";
const BACKUP_RECORD_ID_INVALID_ERROR =
  "Backup contains a record without a valid id";
const BACKUP_RECORD_ID_DUPLICATED_ERROR =
  "Backup contains duplicate record ids";
const OBJECT_TYPE_NAME = "object";
const STRING_TYPE_NAME = "string";

export type StorageBackupRecord = { id: string } & Record<string, unknown>;

export interface ValidatedStorageBackupTableSnapshot {
  table_name: TableName;
  records: StorageBackupRecord[];
}

function build_table_scoped_error(
  error_message: string,
  table_name: TableName,
): string {
  return `${error_message} (${table_name})`;
}

function is_plain_object_record(
  candidate: unknown,
): candidate is Record<string, unknown> {
  return (
    typeof candidate === OBJECT_TYPE_NAME &&
    candidate !== null &&
    !Array.isArray(candidate)
  );
}

function has_valid_record_id(
  candidate: Record<string, unknown>,
): candidate is StorageBackupRecord {
  return (
    typeof candidate.id === STRING_TYPE_NAME &&
    (candidate.id as string).trim().length > 0
  );
}

function validate_storage_backup_record(
  candidate: unknown,
  table_name: TableName,
): Result<StorageBackupRecord> {
  if (!is_plain_object_record(candidate)) {
    return create_failure_result(
      build_table_scoped_error(BACKUP_RECORD_NOT_OBJECT_ERROR, table_name),
    );
  }

  if (!has_valid_record_id(candidate)) {
    return create_failure_result(
      build_table_scoped_error(BACKUP_RECORD_ID_INVALID_ERROR, table_name),
    );
  }

  return create_success_result(candidate);
}

function validate_storage_backup_table_snapshot(
  snapshot: StorageBackupTableSnapshot,
): Result<ValidatedStorageBackupTableSnapshot> {
  const seen_record_ids = new Set<string>();
  const validated_records: StorageBackupRecord[] = [];

  for (const candidate of snapshot.records as unknown[]) {
    const record_result = validate_storage_backup_record(
      candidate,
      snapshot.table_name,
    );

    if (!record_result.success) {
      return record_result;
    }

    if (seen_record_ids.has(record_result.data.id)) {
      return create_failure_result(
        build_table_scoped_error(
          BACKUP_RECORD_ID_DUPLICATED_ERROR,
          snapshot.table_name,
        ),
      );
    }

    seen_record_ids.add(record_result.data.id);
    validated_records.push(record_result.data);
  }

  return create_success_result({
    table_name: snapshot.table_name,
    records: validated_records,
  });
}

function count_total_snapshot_records(
  snapshots: StorageBackupTableSnapshot[],
): number {
  return snapshots.reduce(
    (total: number, snapshot: StorageBackupTableSnapshot) =>
      total + snapshot.records.length,
    0,
  );
}

export function validate_storage_backup_table_snapshots(
  snapshots: StorageBackupTableSnapshot[],
): Result<ValidatedStorageBackupTableSnapshot[]> {
  if (
    count_total_snapshot_records(snapshots) >
    MAXIMUM_STORAGE_BACKUP_TOTAL_RECORDS
  ) {
    return create_failure_result(BACKUP_RECORD_COUNT_EXCEEDED_ERROR);
  }

  const validated_snapshots: ValidatedStorageBackupTableSnapshot[] = [];

  for (const snapshot of snapshots) {
    const snapshot_result = validate_storage_backup_table_snapshot(snapshot);

    if (!snapshot_result.success) {
      return snapshot_result;
    }

    validated_snapshots.push(snapshot_result.data);
  }

  return create_success_result(validated_snapshots);
}
