import type { Table, Transaction } from "dexie";

import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import type { ChangeTrackingGate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import {
  INITIAL_SYNC_CURSOR_SEQUENCE,
  SYNC_CURSORS_TABLE_NAME,
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { is_number_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import {
  select_applicable_changes,
  write_applicable_changes,
} from "./syncRemoteApplyChanges";

const READ_WRITE_MODE = "rw";
const UNKNOWN_SERVER_VERSION = 0;
const SERVER_ONLY_FIELD_NAMES = [
  "_id",
  "_creationTime",
  "local_id",
  "synced_at",
  "version",
  "sync_sequence",
];

export interface RemoteRecordChange {
  local_id: string;
  server_version: number;
  local_data: Record<string, unknown>;
}

export interface RemoteDeletion {
  local_id: string;
  server_version: number;
}

interface RemoteChangePage {
  table_name: string;
  records: RemoteRecordChange[];
  deletions: RemoteDeletion[];
  next_cursor: number;
}

export interface RemoteApplySummary {
  applied_count: number;
  deferred_local_ids: string[];
}

export interface RemoteApplyDependencies {
  database: SportSyncDatabase;
  gate: ChangeTrackingGate;
}

export type GenericTable = Table<Record<string, unknown>, unknown>;

export function convert_server_record_to_remote_change(
  server_record: Record<string, unknown>,
): RemoteRecordChange {
  const local_id = String(server_record.local_id);
  const local_data: Record<string, unknown> = { ...server_record };
  for (const field_name of SERVER_ONLY_FIELD_NAMES)
    delete local_data[field_name];
  local_data.id = local_id;
  const version = server_record.version;
  return {
    local_id,
    server_version: is_number_value(version) ? version : UNKNOWN_SERVER_VERSION,
    local_data,
  };
}

export async function run_remote_apply_transaction<TResult>(
  dependencies: RemoteApplyDependencies,
  table_name: string,
  scope: (tables: {
    data: GenericTable;
    outbox: GenericTable;
    versions: GenericTable;
    cursors: GenericTable;
  }) => Promise<TResult>,
): Promise<TResult> {
  const database = dependencies.database;
  const table_names = [
    table_name,
    SYNC_OUTBOX_TABLE_NAME,
    SYNC_RECORD_VERSIONS_TABLE_NAME,
    SYNC_CURSORS_TABLE_NAME,
  ];
  return database.transaction(
    READ_WRITE_MODE,
    table_names,
    async (transaction: Transaction) => {
      dependencies.gate.mark_remote_apply_transaction(transaction.idbtrans);
      return scope({
        data: database.table(table_name),
        outbox: database.table(SYNC_OUTBOX_TABLE_NAME),
        versions: database.table(SYNC_RECORD_VERSIONS_TABLE_NAME),
        cursors: database.table(SYNC_CURSORS_TABLE_NAME),
      });
    },
  );
}

async function advance_cursor(
  cursors: GenericTable,
  table_name: string,
  next_cursor: number,
): Promise<number> {
  const current_cursor = await cursors.get(table_name);
  const previous_sequence = current_cursor
    ? Number(current_cursor.after_sequence)
    : INITIAL_SYNC_CURSOR_SEQUENCE;
  const advanced_sequence = Math.max(previous_sequence, next_cursor);
  await cursors.put({ table_name, after_sequence: advanced_sequence });
  return advanced_sequence;
}

export async function apply_remote_change_page(
  dependencies: RemoteApplyDependencies,
  page: RemoteChangePage,
): Promise<RemoteApplySummary> {
  return run_remote_apply_transaction(
    dependencies,
    page.table_name,
    async (tables) => {
      const applicable = await select_applicable_changes(tables, page);
      const applied_count = await write_applicable_changes(
        tables,
        page.table_name,
        applicable,
      );
      await advance_cursor(tables.cursors, page.table_name, page.next_cursor);
      return {
        applied_count,
        deferred_local_ids: [...applicable.dirty],
      };
    },
  );
}
