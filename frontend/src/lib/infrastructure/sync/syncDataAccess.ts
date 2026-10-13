import type { Table } from "dexie";

import type {
  IsoDateTimeString,
  ScalarValueInput,
} from "$lib/core/types/DomainScalars";

import {
  get_database,
  type SportSyncDatabase,
} from "../../adapters/repositories/database";
import type { TableName } from "./syncTypes";

type SyncTimestamp = ScalarValueInput<IsoDateTimeString>;

type SyncRecord = {
  id: string;
  updated_at?: SyncTimestamp;
  created_at?: SyncTimestamp;
};

type SyncTable = Table<SyncRecord, string>;

function cast_sync_table<TEntity>(table: Table<TEntity, string>): SyncTable {
  return table as unknown as SyncTable;
}

export function get_table_from_database(
  database: SportSyncDatabase,
  table_name: TableName,
): SyncTable {
  const table: SportSyncDatabase[TableName] = database[table_name];
  return cast_sync_table(table as Table<unknown, string>);
}

export { get_database };
