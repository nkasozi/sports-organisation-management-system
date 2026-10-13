import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import { TABLE_NAMES } from "$lib/infrastructure/sync/syncTypes";

import type {
  PreparedStorageBackupRestore,
  StorageBackupCoordinatorDependencies,
  StorageBackupSummary,
} from "./storageBackupContracts";
import {
  build_storage_backup_envelope,
  type StorageBackupEnvelope,
  type StorageBackupSource,
  type StorageBackupTableSnapshot,
} from "./storageBackupFormat";
import { parse_storage_backup_envelope_json } from "./storageBackupParsing";
import { validate_storage_backup_table_snapshots } from "./storageBackupRecordValidation";

export function create_storage_backup_summary(
  envelope: StorageBackupEnvelope,
): StorageBackupSummary {
  const tables_with_records = envelope.table_snapshots.filter(
    (snapshot: StorageBackupTableSnapshot) => snapshot.record_count > 0,
  ).length;
  const total_records = envelope.table_snapshots.reduce(
    (total: number, snapshot: StorageBackupTableSnapshot) =>
      total + snapshot.record_count,
    0,
  );

  return {
    created_at: envelope.metadata.created_at,
    source: envelope.metadata.source,
    total_tables: TABLE_NAMES.length,
    tables_with_records,
    total_records,
    session_sync_marker_state: envelope.metadata.session_sync_marker_state,
  };
}

export function parse_and_validate_storage_backup(
  serialized_backup: string,
): Result<PreparedStorageBackupRestore> {
  const envelope_result = parse_storage_backup_envelope_json(serialized_backup);

  if (!envelope_result.success) {
    return envelope_result;
  }

  const validated_snapshots_result = validate_storage_backup_table_snapshots(
    envelope_result.data.table_snapshots,
  );

  if (!validated_snapshots_result.success) {
    return create_failure_result(validated_snapshots_result.error);
  }

  return create_success_result({
    summary: create_storage_backup_summary(envelope_result.data),
    envelope: envelope_result.data,
    validated_table_snapshots: validated_snapshots_result.data,
  });
}

export async function build_current_storage_backup_envelope(
  dependencies: StorageBackupCoordinatorDependencies,
  source: StorageBackupSource,
): Promise<StorageBackupEnvelope> {
  const [
    table_snapshots,
    sync_bookkeeping,
    bootstrap_state,
    session_sync_marker_state,
  ] = await Promise.all([
    dependencies.database_port.export_table_snapshots(),
    dependencies.database_port.export_sync_bookkeeping(),
    dependencies.bootstrap_state_port.load_bootstrap_state(),
    dependencies.get_session_sync_marker_state(),
  ]);

  return build_storage_backup_envelope({
    created_at: dependencies.now(),
    source,
    app_initialized: bootstrap_state.app_initialized,
    seeding_complete: bootstrap_state.seeding_complete,
    session_sync_marker_state,
    table_snapshots,
    sync_bookkeeping,
  });
}
