import type { Table } from "dexie";

import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import {
  INITIAL_SYNC_CURSOR_SEQUENCE,
  SYNC_BOOKKEEPING_TABLE_NAMES,
  SYNC_CURSORS_TABLE_NAME,
  SYNC_OUTBOX_TABLE_NAME,
  type SyncOutboxEntry,
  SyncOutboxEntryStatus,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

const READ_WRITE_MODE = "rw";
const STATUS_INDEX = "status";
const TABLE_NAME_INDEX = "table_name";

export interface OutboxSummary {
  pending_count: number;
  rejected_count: number;
  conflicted_count: number;
}

export const EMPTY_OUTBOX_SUMMARY: OutboxSummary = {
  pending_count: 0,
  rejected_count: 0,
  conflicted_count: 0,
};

export type OutboxTable = Table<SyncOutboxEntry, unknown>;

export function outbox_table(database: SportSyncDatabase): OutboxTable {
  return database.table(SYNC_OUTBOX_TABLE_NAME) as OutboxTable;
}

export function count_unsynced_changes(summary: OutboxSummary): number {
  return (
    summary.pending_count + summary.rejected_count + summary.conflicted_count
  );
}

export async function summarize_outbox(
  database: SportSyncDatabase,
): Promise<OutboxSummary> {
  const table = outbox_table(database);
  const count_status = (status: string): Promise<number> =>
    table.where(STATUS_INDEX).equals(status).count();
  return {
    pending_count: await count_status(SyncOutboxEntryStatus.PENDING),
    rejected_count: await count_status(SyncOutboxEntryStatus.REJECTED),
    conflicted_count: await count_status(SyncOutboxEntryStatus.CONFLICTED),
  };
}

export async function list_tables_with_pending_entries(
  database: SportSyncDatabase,
): Promise<Set<string>> {
  const pending = await outbox_table(database)
    .where(STATUS_INDEX)
    .equals(SyncOutboxEntryStatus.PENDING)
    .toArray();
  return new Set(pending.map((entry) => entry.table_name));
}

export async function list_pending_entries_for_table(
  database: SportSyncDatabase,
  table_name: string,
): Promise<SyncOutboxEntry[]> {
  const entries = await outbox_table(database)
    .where(TABLE_NAME_INDEX)
    .equals(table_name)
    .toArray();
  return entries.filter(
    (entry) => entry.status === SyncOutboxEntryStatus.PENDING,
  );
}

export async function read_sync_cursor(
  database: SportSyncDatabase,
  table_name: string,
): Promise<number> {
  const cursor = await database.table(SYNC_CURSORS_TABLE_NAME).get(table_name);
  return cursor ? Number(cursor.after_sequence) : INITIAL_SYNC_CURSOR_SEQUENCE;
}

export async function reset_sync_bookkeeping(
  database: SportSyncDatabase,
): Promise<boolean> {
  await database.transaction(
    READ_WRITE_MODE,
    [...SYNC_BOOKKEEPING_TABLE_NAMES],
    async () => {
      for (const table_name of SYNC_BOOKKEEPING_TABLE_NAMES)
        await database.table(table_name).clear();
    },
  );
  console.log("[Sync] Sync bookkeeping reset", {
    event: "sync_bookkeeping_reset",
  });
  return true;
}
