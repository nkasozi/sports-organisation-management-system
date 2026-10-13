import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import {
  build_sync_outbox_key,
  create_known_base_version,
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
  type SyncOutboxEntry,
  SyncOutboxEntryStatus,
  SyncOutboxOperation,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import { outbox_table, type OutboxTable } from "./syncOutboxRepository";

const READ_WRITE_MODE = "rw";

async function update_if_token_matches(
  database: SportSyncDatabase,
  entry: SyncOutboxEntry,
  on_match: (table: OutboxTable) => Promise<unknown>,
  on_superseded: (
    table: OutboxTable,
    current: SyncOutboxEntry,
  ) => Promise<unknown>,
): Promise<boolean> {
  const table = outbox_table(database);
  return database.transaction(
    READ_WRITE_MODE,
    [SYNC_OUTBOX_TABLE_NAME, SYNC_RECORD_VERSIONS_TABLE_NAME],
    async () => {
      const key = build_sync_outbox_key(entry.table_name, entry.local_id);
      const current = await table.get(key);
      if (!current) return false;
      if (current.change_token !== entry.change_token) {
        await on_superseded(table, current);
        return false;
      }
      await on_match(table);
      return true;
    },
  );
}

export async function confirm_outbox_entry(
  database: SportSyncDatabase,
  entry: SyncOutboxEntry,
  server_version: number,
): Promise<boolean> {
  const key = build_sync_outbox_key(entry.table_name, entry.local_id);
  const versions = database.table(SYNC_RECORD_VERSIONS_TABLE_NAME);
  const is_delete = entry.operation === SyncOutboxOperation.DELETE;
  return update_if_token_matches(
    database,
    entry,
    async (table) => {
      await table.delete(key);
      return is_delete
        ? versions.delete(key)
        : versions.put({ ...pick_identity(entry), server_version });
    },
    async (table, current) =>
      table.put({
        ...current,
        base_version: create_known_base_version(server_version),
      }),
  );
}

function pick_identity(entry: SyncOutboxEntry): {
  table_name: string;
  local_id: string;
} {
  return { table_name: entry.table_name, local_id: entry.local_id };
}

export async function mark_outbox_entry_rejected(
  database: SportSyncDatabase,
  entry: SyncOutboxEntry,
  rejection: { code: string; message: string },
): Promise<boolean> {
  return update_if_token_matches(
    database,
    entry,
    async (table) =>
      table.put({
        ...entry,
        status: SyncOutboxEntryStatus.REJECTED,
        rejection_code: rejection.code,
        rejection_message: rejection.message,
      }),
    async () => false,
  );
}

export async function mark_outbox_entry_conflicted(
  database: SportSyncDatabase,
  entry: SyncOutboxEntry,
  remote_version: number,
): Promise<boolean> {
  return update_if_token_matches(
    database,
    entry,
    async (table) =>
      table.put({
        ...entry,
        status: SyncOutboxEntryStatus.CONFLICTED,
        remote_version,
      }),
    async () => false,
  );
}

export async function discard_outbox_entry(
  database: SportSyncDatabase,
  entry: SyncOutboxEntry,
): Promise<boolean> {
  const key = build_sync_outbox_key(entry.table_name, entry.local_id);
  return update_if_token_matches(
    database,
    entry,
    async (table) => table.delete(key),
    async () => false,
  );
}
