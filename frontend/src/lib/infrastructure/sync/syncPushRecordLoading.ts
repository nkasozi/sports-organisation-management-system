import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { discard_outbox_entry } from "./syncOutboxEntryUpdates";
import type { PushTableOutboxCommand } from "./syncPushTransport";

export type LocalRecord = Record<string, unknown> & { id: string };

export interface LoadedOutboxRecord {
  entry: SyncOutboxEntry;
  record: LocalRecord;
}

interface LoadedRecords {
  loaded: LoadedOutboxRecord[];
  orphaned: SyncOutboxEntry[];
}

function split_loaded_records(
  entries: SyncOutboxEntry[],
  records: Array<LocalRecord | undefined>,
): LoadedRecords {
  const loaded: LoadedOutboxRecord[] = [];
  const orphaned: SyncOutboxEntry[] = [];
  entries.forEach((entry, index) => {
    const record = records[index];
    if (record) loaded.push({ entry, record });
    else orphaned.push(entry);
  });
  return { loaded, orphaned };
}

async function discard_orphaned_entries(
  command: PushTableOutboxCommand,
  orphaned: SyncOutboxEntry[],
): Promise<number> {
  for (const entry of orphaned) {
    await discard_outbox_entry(command.database, entry);
    console.warn("[Sync:Push] Dropped outbox entry for a missing record", {
      event: "sync_outbox_entry_orphaned",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      local_id: entry.local_id,
    });
  }
  return orphaned.length;
}

async function read_records_without_modifying_them(
  command: PushTableOutboxCommand,
  entries: SyncOutboxEntry[],
): Promise<LoadedRecords> {
  const records = (await command.database
    .table(command.table_name)
    .bulkGet(entries.map((entry) => entry.local_id))) as Array<
    LocalRecord | undefined
  >;
  return split_loaded_records(entries, records);
}

export async function load_outbox_records(
  command: PushTableOutboxCommand,
  entries: SyncOutboxEntry[],
): AsyncResult<LoadedOutboxRecord[]> {
  try {
    const read = await read_records_without_modifying_them(command, entries);
    await discard_orphaned_entries(command, read.orphaned);
    return create_success_result(read.loaded);
  } catch (error) {
    console.error("[Sync:Push] Failed to read records for push", {
      event: "sync_push_record_read_failed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}
