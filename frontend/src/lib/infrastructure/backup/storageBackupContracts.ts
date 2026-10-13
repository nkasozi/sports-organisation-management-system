import type { AsyncResult } from "$lib/core/types/Result";
import type { TableName } from "$lib/infrastructure/sync/syncTypes";
import type {
  BlockedRecoverableSessionSyncMarkerSafetyStatus,
  RecoverableSessionSyncMarkerSafety,
  RecoverableSessionSyncMarkerState,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  StorageBackupEnvelope,
  StorageBackupSource,
} from "./storageBackupFormat";
import type { ValidatedStorageBackupTableSnapshot } from "./storageBackupRecordValidation";
import type {
  DEVICE_BACKUP_CAPABILITY_STATUS,
  DEVICE_BACKUP_DELETE_STATUS,
  DEVICE_BACKUP_READ_STATUS,
  DEVICE_BACKUP_WRITE_STATUS,
  PENDING_LOCAL_CHANGE_STATUS,
  STORAGE_STARTUP_RECOVERY_STATUS,
} from "./storageBackupStatus";
import type { StorageBackupSyncBookkeeping } from "./storageBackupSyncBookkeeping";

type StartupStatus = typeof STORAGE_STARTUP_RECOVERY_STATUS;

export interface StorageBackupSummary {
  created_at: string;
  source: StorageBackupSource;
  total_tables: number;
  tables_with_records: number;
  total_records: number;
  session_sync_marker_state: RecoverableSessionSyncMarkerState;
}

export interface PreparedStorageBackupRestore {
  summary: StorageBackupSummary;
  envelope: StorageBackupEnvelope;
  validated_table_snapshots: ValidatedStorageBackupTableSnapshot[];
}

export type DeviceBackupCapabilityState = {
  status: (typeof DEVICE_BACKUP_CAPABILITY_STATUS)[keyof typeof DEVICE_BACKUP_CAPABILITY_STATUS];
};

export type DeviceBackupReadState =
  | {
      status: typeof DEVICE_BACKUP_READ_STATUS.AVAILABLE;
      serialized_backup: string;
    }
  | { status: typeof DEVICE_BACKUP_READ_STATUS.FAILED; error: string }
  | { status: typeof DEVICE_BACKUP_READ_STATUS.MISSING }
  | { status: typeof DEVICE_BACKUP_READ_STATUS.UNSUPPORTED };

export type DeviceBackupDeleteState =
  | { status: typeof DEVICE_BACKUP_DELETE_STATUS.DELETED }
  | { status: typeof DEVICE_BACKUP_DELETE_STATUS.ALREADY_MISSING }
  | { status: typeof DEVICE_BACKUP_DELETE_STATUS.UNSUPPORTED }
  | { status: typeof DEVICE_BACKUP_DELETE_STATUS.FAILED; error: string };

export type DeviceBackupWriteOutcome =
  | {
      status: typeof DEVICE_BACKUP_WRITE_STATUS.WRITTEN;
      summary: StorageBackupSummary;
    }
  | {
      status: typeof DEVICE_BACKUP_WRITE_STATUS.SKIPPED_NOT_RESTORABLE;
      safety_status: BlockedRecoverableSessionSyncMarkerSafetyStatus;
    }
  | { status: typeof DEVICE_BACKUP_WRITE_STATUS.SKIPPED_WRITER_CLOSED };

export type PendingLocalChangeState =
  | { status: typeof PENDING_LOCAL_CHANGE_STATUS.NO_PENDING_LOCAL_CHANGES }
  | {
      status: typeof PENDING_LOCAL_CHANGE_STATUS.PENDING_LOCAL_CHANGES_PRESENT;
    }
  | {
      status: typeof PENDING_LOCAL_CHANGE_STATUS.COUNT_UNAVAILABLE;
      error: string;
    };

export type StorageStartupRecoveryState =
  | { status: StartupStatus["BACKUP_MISSING"] }
  | { status: StartupStatus["DEVICE_BACKUP_READ_FAILED"]; error: string }
  | { status: StartupStatus["DEVICE_BACKUP_UNSUPPORTED"] }
  | { status: StartupStatus["INVALID_DEVICE_BACKUP"]; error: string }
  | { status: StartupStatus["LOCAL_DATA_PRESENT"] }
  | {
      status: StartupStatus["RESTORE_AVAILABLE"];
      summary: StorageBackupSummary;
    }
  | {
      status: StartupStatus["RESTORE_BLOCKED"];
      summary: StorageBackupSummary;
      safety_status: BlockedRecoverableSessionSyncMarkerSafetyStatus;
    };

export interface ReplaceAllTablesAtomicallyCommand {
  table_snapshots: ValidatedStorageBackupTableSnapshot[];
  sync_bookkeeping: StorageBackupSyncBookkeeping;
  persist_settings_within_transaction(): Promise<boolean>;
}

export interface StorageBackupDatabasePort {
  export_table_snapshots(): Promise<
    Array<{ table_name: TableName; records: Record<string, unknown>[] }>
  >;
  export_sync_bookkeeping(): Promise<StorageBackupSyncBookkeeping>;
  replace_all_tables_atomically(
    command: ReplaceAllTablesAtomicallyCommand,
  ): AsyncResult<boolean>;
  get_total_record_count(): Promise<number>;
}

export interface StorageBackupBootstrapState {
  app_initialized: boolean;
  seeding_complete: boolean;
}

export interface StorageBackupBootstrapStatePort {
  load_bootstrap_state(): Promise<StorageBackupBootstrapState>;
  persist_bootstrap_state(
    bootstrap_state: StorageBackupBootstrapState,
  ): Promise<boolean>;
}

export interface DeviceBackupStoragePort {
  get_capability(): DeviceBackupCapabilityState;
  read_backup_json(): Promise<DeviceBackupReadState>;
  write_backup_json(serialized_backup: string): AsyncResult<boolean>;
  delete_backup(): Promise<DeviceBackupDeleteState>;
}

export interface PendingLocalChangeStatePort {
  get_pending_local_change_state(): Promise<PendingLocalChangeState>;
}

export interface StorageBackupSyncSuspensionPort {
  stop_background_sync(): boolean;
  start_background_sync(): boolean;
  stop_remote_sync(): boolean;
  start_remote_sync(): boolean;
  set_pulling_from_remote(is_pulling_from_remote: boolean): boolean;
}

export interface StorageBackupCoordinatorDependencies {
  database_port: StorageBackupDatabasePort;
  bootstrap_state_port: StorageBackupBootstrapStatePort;
  device_backup_storage_port: DeviceBackupStoragePort;
  pending_local_change_state_port: PendingLocalChangeStatePort;
  sync_suspension_port: StorageBackupSyncSuspensionPort;
  get_session_sync_marker_state(): Promise<RecoverableSessionSyncMarkerState>;
  persist_session_sync_marker_state(
    marker_state: RecoverableSessionSyncMarkerState,
  ): Promise<boolean>;
  evaluate_restore_safety(
    marker_state: RecoverableSessionSyncMarkerState,
  ): Promise<RecoverableSessionSyncMarkerSafety>;
  now(): string;
}
