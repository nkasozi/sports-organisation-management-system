import type { TransactionMode } from "dexie";

import {
  SYNC_BOOKKEEPING_TABLE_NAMES,
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
  type SyncOutboxEntry,
  type SyncRecordVersion,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  TABLE_NAMES,
  type TableName,
} from "$lib/infrastructure/sync/syncTypes";

import type {
  ReplaceAllTablesAtomicallyCommand,
  StorageBackupDatabasePort,
} from "./storageBackupContracts";
import type {
  StorageBackupRecord,
  ValidatedStorageBackupTableSnapshot,
} from "./storageBackupRecordValidation";
import type { StorageBackupSyncBookkeeping } from "./storageBackupSyncBookkeeping";

const READ_WRITE_TRANSACTION_MODE: TransactionMode = "rw";
const APP_SETTINGS_TABLE_NAME = "app_settings";
const STORAGE_BACKUP_ATOMIC_REPLACE_SUCCEEDED_EVENT =
  "storage_backup_atomic_replace_succeeded";
const STORAGE_BACKUP_ATOMIC_REPLACE_FAILED_EVENT =
  "storage_backup_atomic_replace_failed";
const RESTORE_SETTINGS_NOT_PERSISTED_ERROR =
  "Restore settings could not be persisted";

export interface StorageBackupDexieTransaction {
  idbtrans: Pick<IDBTransaction, "objectStore">;
}

interface StorageBackupDexieTable {
  bulkPut(
    records: StorageBackupRecord[] | SyncOutboxEntry[] | SyncRecordVersion[],
  ): Promise<unknown>;
  toArray(): Promise<unknown[]>;
  count(): Promise<number>;
}

export interface StorageBackupDexieDatabase {
  transaction(
    mode: TransactionMode,
    table_names: readonly string[],
    scope: (transaction: StorageBackupDexieTransaction) => Promise<boolean>,
  ): Promise<boolean>;
  table(table_name: string): StorageBackupDexieTable;
}

type MarkRestoreTransactionUntracked = (
  low_level_transaction: object,
) => boolean;

function clear_tables_without_dexie_hooks(
  transaction: StorageBackupDexieTransaction,
): boolean {
  for (const table_name of [...TABLE_NAMES, ...SYNC_BOOKKEEPING_TABLE_NAMES]) {
    transaction.idbtrans.objectStore(table_name).clear();
  }
  return true;
}

async function write_validated_snapshots(
  database: StorageBackupDexieDatabase,
  table_snapshots: ValidatedStorageBackupTableSnapshot[],
): Promise<boolean> {
  for (const table_snapshot of table_snapshots) {
    if (table_snapshot.records.length === 0) {
      continue;
    }

    await database
      .table(table_snapshot.table_name)
      .bulkPut(table_snapshot.records);
  }
  return true;
}

async function write_sync_bookkeeping(
  database: StorageBackupDexieDatabase,
  sync_bookkeeping: StorageBackupSyncBookkeeping,
): Promise<boolean> {
  if (sync_bookkeeping.outbox_entries.length > 0)
    await database
      .table(SYNC_OUTBOX_TABLE_NAME)
      .bulkPut(sync_bookkeeping.outbox_entries);
  if (sync_bookkeeping.record_versions.length > 0)
    await database
      .table(SYNC_RECORD_VERSIONS_TABLE_NAME)
      .bulkPut(sync_bookkeeping.record_versions);
  return true;
}

async function persist_settings_or_roll_back(
  command: ReplaceAllTablesAtomicallyCommand,
): Promise<boolean> {
  const settings_persisted =
    await command.persist_settings_within_transaction();
  return settings_persisted
    ? true
    : Promise.reject(new Error(RESTORE_SETTINGS_NOT_PERSISTED_ERROR));
}

async function export_sync_bookkeeping(
  database: StorageBackupDexieDatabase,
): Promise<StorageBackupSyncBookkeeping> {
  const [outbox_entries, record_versions] = await Promise.all([
    database.table(SYNC_OUTBOX_TABLE_NAME).toArray(),
    database.table(SYNC_RECORD_VERSIONS_TABLE_NAME).toArray(),
  ]);
  return {
    outbox_entries: outbox_entries as SyncOutboxEntry[],
    record_versions: record_versions as SyncRecordVersion[],
  };
}

async function replace_all_tables_atomically(
  database: StorageBackupDexieDatabase,
  mark_restore_transaction_untracked: MarkRestoreTransactionUntracked,
  command: ReplaceAllTablesAtomicallyCommand,
): AsyncResult<boolean> {
  try {
    await database.transaction(
      READ_WRITE_TRANSACTION_MODE,
      [
        ...TABLE_NAMES,
        ...SYNC_BOOKKEEPING_TABLE_NAMES,
        APP_SETTINGS_TABLE_NAME,
      ],
      async (transaction: StorageBackupDexieTransaction): Promise<boolean> => {
        mark_restore_transaction_untracked(transaction.idbtrans);
        clear_tables_without_dexie_hooks(transaction);
        await write_validated_snapshots(database, command.table_snapshots);
        await write_sync_bookkeeping(database, command.sync_bookkeeping);
        return persist_settings_or_roll_back(command);
      },
    );
    console.log("[StorageBackup] Atomic table replace committed", {
      event: STORAGE_BACKUP_ATOMIC_REPLACE_SUCCEEDED_EVENT,
      table_count: command.table_snapshots.length,
    });
    return create_success_result(true);
  } catch (error) {
    console.error("[StorageBackup] Atomic table replace rolled back", {
      event: STORAGE_BACKUP_ATOMIC_REPLACE_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

export function create_storage_backup_dexie_database_port(
  database_factory: () => StorageBackupDexieDatabase,
  mark_restore_transaction_untracked: MarkRestoreTransactionUntracked,
): StorageBackupDatabasePort {
  return {
    export_table_snapshots: async () => {
      const database = database_factory();
      return Promise.all(
        TABLE_NAMES.map(async (table_name: TableName) => ({
          table_name,
          records: (await database.table(table_name).toArray()) as Record<
            string,
            unknown
          >[],
        })),
      );
    },
    export_sync_bookkeeping: () => export_sync_bookkeeping(database_factory()),
    replace_all_tables_atomically: (
      command: ReplaceAllTablesAtomicallyCommand,
    ) =>
      replace_all_tables_atomically(
        database_factory(),
        mark_restore_transaction_untracked,
        command,
      ),
    get_total_record_count: async () => {
      const database = database_factory();
      const counts = await Promise.all(
        TABLE_NAMES.map((table_name: TableName) =>
          database.table(table_name).count(),
        ),
      );
      return counts.reduce((total: number, count: number) => total + count, 0);
    },
  };
}
