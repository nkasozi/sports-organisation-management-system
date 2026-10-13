import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import { build_pending_outbox_entry } from "$lib/adapters/repositories/syncOutbox/syncOutboxEntryBuilder";
import {
  build_sync_outbox_key,
  SYNC_OUTBOX_TABLE_NAME,
  SyncOutboxOperation,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { create_none_option } from "$lib/core/types/Option";

const READ_WRITE_MODE = "rw";

interface EnqueueLocalSnapshotCommand {
  database: SportSyncDatabase;
  table_names: readonly string[];
  generate_change_token(): string;
  now_iso(): string;
}

async function enqueue_table_snapshot(
  command: EnqueueLocalSnapshotCommand,
  table_name: string,
): Promise<number> {
  const local_ids = (
    await command.database.table(table_name).toCollection().primaryKeys()
  ).map(String);
  const outbox = command.database.table(SYNC_OUTBOX_TABLE_NAME);
  const existing = await outbox.bulkGet(
    local_ids.map((local_id) => build_sync_outbox_key(table_name, local_id)),
  );
  const missing_ids = local_ids.filter((_id, index) => !existing[index]);
  await outbox.bulkPut(
    missing_ids.map((local_id) =>
      build_pending_outbox_entry({
        table_name,
        local_id,
        operation: SyncOutboxOperation.UPSERT,
        existing_entry: create_none_option(),
        known_server_version: create_none_option(),
        change_token: command.generate_change_token(),
        enqueued_at: command.now_iso(),
      }),
    ),
  );
  return missing_ids.length;
}

export async function enqueue_local_snapshot(
  command: EnqueueLocalSnapshotCommand,
): Promise<number> {
  return command.database.transaction(
    READ_WRITE_MODE,
    [...command.table_names, SYNC_OUTBOX_TABLE_NAME],
    async () => {
      let enqueued_count = 0;
      for (const table_name of command.table_names)
        enqueued_count += await enqueue_table_snapshot(command, table_name);
      return enqueued_count;
    },
  );
}
