import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { remediate_oversized_inline_file_records } from "./syncInlineFileRemediation";
import { discard_outbox_entry } from "./syncOutboxEntryUpdates";
import type { PushTableOutboxCommand } from "./syncPushTransport";
import { run_remote_apply_transaction } from "./syncRemoteApply";
import { EPOCH_TIMESTAMP } from "./syncTypes";

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

function read_and_remediate_in_one_transaction(
  command: PushTableOutboxCommand,
  entries: SyncOutboxEntry[],
): AsyncResult<LoadedRecords> {
  return run_remote_apply_transaction(
    command,
    command.table_name,
    async (tables) => {
      const records = (await tables.data.bulkGet(
        entries.map((entry) => entry.local_id),
      )) as Array<LocalRecord | undefined>;
      const split = split_loaded_records(entries, records);
      const remediation = await remediate_oversized_inline_file_records({
        table: tables.data as never,
        table_name: command.table_name,
        all_local_records: split.loaded.map((item) => item.record),
        remote_latest_modified_at: EPOCH_TIMESTAMP,
        detect_conflicts: command.detect_conflicts,
        get_is_remote_sync_in_progress: (): boolean => true,
        set_remote_sync_in_progress: (): boolean => true,
      });
      if (!remediation.success) return remediation;
      const remediated = remediation.data.records as LocalRecord[];
      return create_success_result({
        loaded: split.loaded.map((item, index) => ({
          entry: item.entry,
          record: remediated[index],
        })),
        orphaned: split.orphaned,
      });
    },
  );
}

export async function load_remediated_records(
  command: PushTableOutboxCommand,
  entries: SyncOutboxEntry[],
): AsyncResult<LoadedOutboxRecord[]> {
  try {
    const read = await read_and_remediate_in_one_transaction(command, entries);
    if (!read.success) return read;
    await discard_orphaned_entries(command, read.data.orphaned);
    return create_success_result(read.data.loaded);
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
