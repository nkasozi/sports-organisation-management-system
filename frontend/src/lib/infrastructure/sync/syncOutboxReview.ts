import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import {
  build_sync_outbox_key,
  create_recreate_base_version,
  SYNC_OUTBOX_TABLE_NAME,
  type SyncOutboxEntry,
  SyncOutboxEntryStatus,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { outbox_table } from "./syncOutboxRepository";

export { discard_rejected_change } from "./syncOutboxReviewDiscard";
export { discard_remotely_deleted_change } from "./syncOutboxReviewRemoteDeletion";

const STATUS_INDEX = "status";
const READ_WRITE_MODE = "rw";
const NO_LONGER_WAITING_ERROR =
  "This change is no longer waiting for a decision";

export interface RejectedChange {
  table_name: string;
  local_id: string;
  rejection_code: string;
  rejection_message: string;
}

function to_pending_entry(
  entry: SyncOutboxEntry,
  base_version: SyncOutboxEntry["base_version"],
): SyncOutboxEntry {
  return {
    table_name: entry.table_name,
    local_id: entry.local_id,
    operation: entry.operation,
    base_version,
    change_token: entry.change_token,
    enqueued_at: entry.enqueued_at,
    status: SyncOutboxEntryStatus.PENDING,
  };
}

async function requeue_if_unchanged(
  table: ReturnType<typeof outbox_table>,
  entry: SyncOutboxEntry,
): Promise<boolean> {
  const current = await table.get(
    build_sync_outbox_key(entry.table_name, entry.local_id),
  );
  if (!current || current.status !== SyncOutboxEntryStatus.CONFLICTED)
    return false;
  if (current.change_token !== entry.change_token) return false;
  await table.put(to_pending_entry(entry, entry.base_version));
  return true;
}

export async function requeue_conflicted_entries(
  database: SportSyncDatabase,
): Promise<number> {
  const table = outbox_table(database);
  const requeued_count = await database.transaction(
    READ_WRITE_MODE,
    [SYNC_OUTBOX_TABLE_NAME],
    async () => {
      const conflicted = await table
        .where(STATUS_INDEX)
        .equals(SyncOutboxEntryStatus.CONFLICTED)
        .toArray();
      let count = 0;
      for (const entry of conflicted)
        if (await requeue_if_unchanged(table, entry)) count += 1;
      return count;
    },
  );
  console.log("[Sync:Review] Unresolved conflicts queued for re-detection", {
    event: "sync_review_conflicts_requeued",
    conflict_count: requeued_count,
  });
  return requeued_count;
}

export async function list_rejected_changes(
  database: SportSyncDatabase,
): Promise<RejectedChange[]> {
  const rejected = await outbox_table(database)
    .where(STATUS_INDEX)
    .equals(SyncOutboxEntryStatus.REJECTED)
    .toArray();
  return rejected.flatMap((entry) =>
    entry.status === SyncOutboxEntryStatus.REJECTED
      ? [
          {
            table_name: entry.table_name,
            local_id: entry.local_id,
            rejection_code: entry.rejection_code,
            rejection_message: entry.rejection_message,
          },
        ]
      : [],
  );
}

async function replace_waiting_entry(
  database: SportSyncDatabase,
  key: { table_name: string; local_id: string; status: string },
  build_next: (entry: SyncOutboxEntry) => SyncOutboxEntry,
): AsyncResult<boolean> {
  const table = outbox_table(database);
  const replaced = await database.transaction(
    READ_WRITE_MODE,
    [table.name],
    async () => {
      const entry = await table.get(
        build_sync_outbox_key(key.table_name, key.local_id),
      );
      if (!entry || entry.status !== key.status) return false;
      await table.put(build_next(entry));
      return true;
    },
  );
  return replaced
    ? create_success_result(true)
    : create_failure_result(NO_LONGER_WAITING_ERROR);
}

export function restore_remotely_deleted_change(
  database: SportSyncDatabase,
  table_name: string,
  local_id: string,
): AsyncResult<boolean> {
  return replace_waiting_entry(
    database,
    { table_name, local_id, status: SyncOutboxEntryStatus.CONFLICTED },
    (entry) => to_pending_entry(entry, create_recreate_base_version()),
  );
}

export function requeue_rejected_change(
  database: SportSyncDatabase,
  table_name: string,
  local_id: string,
): AsyncResult<boolean> {
  return replace_waiting_entry(
    database,
    { table_name, local_id, status: SyncOutboxEntryStatus.REJECTED },
    (entry) => to_pending_entry(entry, entry.base_version),
  );
}
