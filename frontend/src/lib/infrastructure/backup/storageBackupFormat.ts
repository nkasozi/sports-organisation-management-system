import {
  TABLE_NAMES,
  type TableName,
} from "$lib/infrastructure/sync/syncTypes";
import type { RecoverableSessionSyncMarkerState } from "$lib/presentation/stores/recoverableSessionSyncMarker";

import { STORAGE_BACKUP_SOURCE } from "./storageBackupStatus";
import type { StorageBackupSyncBookkeeping } from "./storageBackupSyncBookkeeping";

export const STORAGE_BACKUP_FORMAT_VERSION = 2;
export const LEGACY_STORAGE_BACKUP_FORMAT_VERSION = 1;

export type StorageBackupSource =
  (typeof STORAGE_BACKUP_SOURCE)[keyof typeof STORAGE_BACKUP_SOURCE];

export interface StorageBackupMetadata {
  created_at: string;
  source: StorageBackupSource;
  app_initialized: boolean;
  seeding_complete: boolean;
  session_sync_marker_state: RecoverableSessionSyncMarkerState;
}

export interface StorageBackupTableSnapshot {
  table_name: TableName;
  record_count: number;
  records: Record<string, unknown>[];
}

interface StorageBackupEnvelopeContent {
  metadata: StorageBackupMetadata;
  table_snapshots: StorageBackupTableSnapshot[];
}

export interface CurrentStorageBackupEnvelope extends StorageBackupEnvelopeContent {
  format_version: typeof STORAGE_BACKUP_FORMAT_VERSION;
  sync_bookkeeping: StorageBackupSyncBookkeeping;
}

interface LegacyStorageBackupEnvelope extends StorageBackupEnvelopeContent {
  format_version: typeof LEGACY_STORAGE_BACKUP_FORMAT_VERSION;
}

export type StorageBackupEnvelope =
  | CurrentStorageBackupEnvelope
  | LegacyStorageBackupEnvelope;

export interface BuildStorageBackupEnvelopeInput {
  created_at: string;
  source: StorageBackupSource;
  app_initialized: boolean;
  seeding_complete: boolean;
  session_sync_marker_state: RecoverableSessionSyncMarkerState;
  table_snapshots: Array<{
    table_name: TableName;
    records: Record<string, unknown>[];
  }>;
  sync_bookkeeping: StorageBackupSyncBookkeeping;
}

type RawRecord = Record<string, unknown>;

function create_storage_backup_table_snapshot(
  table_name: TableName,
  records: RawRecord[],
): StorageBackupTableSnapshot {
  return {
    table_name,
    record_count: records.length,
    records,
  };
}

export function normalize_storage_backup_table_snapshots(
  table_snapshots: BuildStorageBackupEnvelopeInput["table_snapshots"],
): StorageBackupTableSnapshot[] {
  const records_by_table_name = new Map<TableName, RawRecord[]>();

  for (const table_snapshot of table_snapshots) {
    records_by_table_name.set(
      table_snapshot.table_name,
      table_snapshot.records,
    );
  }

  return TABLE_NAMES.map((table_name: TableName) =>
    create_storage_backup_table_snapshot(
      table_name,
      records_by_table_name.get(table_name) ?? [],
    ),
  );
}

export function is_storage_backup_source(
  value: unknown,
): value is StorageBackupSource {
  return (
    value === STORAGE_BACKUP_SOURCE.DEVICE_AUTOMATIC ||
    value === STORAGE_BACKUP_SOURCE.MANUAL_EXPORT
  );
}

function build_storage_backup_metadata(
  input: BuildStorageBackupEnvelopeInput,
): StorageBackupMetadata {
  return {
    created_at: input.created_at,
    source: input.source,
    app_initialized: input.app_initialized,
    seeding_complete: input.seeding_complete,
    session_sync_marker_state: input.session_sync_marker_state,
  };
}

export function build_storage_backup_envelope(
  input: BuildStorageBackupEnvelopeInput,
): CurrentStorageBackupEnvelope {
  return {
    format_version: STORAGE_BACKUP_FORMAT_VERSION,
    metadata: build_storage_backup_metadata(input),
    table_snapshots: normalize_storage_backup_table_snapshots(
      input.table_snapshots,
    ),
    sync_bookkeeping: input.sync_bookkeeping,
  };
}

export function serialize_storage_backup_envelope(
  envelope: StorageBackupEnvelope,
): string {
  return JSON.stringify(envelope);
}
