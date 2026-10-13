import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";

import {
  create_sport_sync_database,
  type SportSyncDatabase,
} from "../database";
import {
  SYNC_OUTBOX_TABLE_NAME,
  type SyncOutboxEntry,
} from "./syncOutboxTypes";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

const TEST_DATABASE_PREFIX = "sport_sync_test_";

export function create_test_database_name(): string {
  return `${TEST_DATABASE_PREFIX}${crypto.randomUUID()}`;
}

export function open_real_test_database(
  database_name: string = create_test_database_name(),
): SportSyncDatabase {
  return create_sport_sync_database(database_name);
}

export async function read_real_outbox(
  database: SportSyncDatabase,
): Promise<SyncOutboxEntry[]> {
  return database.table(SYNC_OUTBOX_TABLE_NAME).toArray();
}

export async function read_real_outbox_ids(
  database: SportSyncDatabase,
): Promise<string[]> {
  return (await read_real_outbox(database))
    .map((entry) => `${entry.table_name}:${entry.local_id}`)
    .sort();
}
