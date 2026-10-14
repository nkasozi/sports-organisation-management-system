import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import {
  type SyncOutboxEntry,
  SyncOutboxEntryStatus,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import type { UserRole } from "$lib/core/interfaces/ports";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { mark_outbox_entry_rejected } from "./syncOutboxEntryUpdates";
import { outbox_table } from "./syncOutboxRepository";
import { requeue_rejected_change } from "./syncOutboxReview";
import type { RejectedOutboxRecord } from "./syncPushOutcomes";
import { role_can_push_operation } from "./syncTableNames";

const STATUS_INDEX = "status";

export const PERMISSION_DENIED_REJECTION = {
  code: "rejected_permission_denied",
  message:
    "Your account is not allowed to make this change, so it was not synced. Discard it to restore the saved copy.",
} as const;

function to_rejected_record(entry: SyncOutboxEntry): RejectedOutboxRecord {
  return {
    table_name: entry.table_name,
    local_id: entry.local_id,
    rejection_code: PERMISSION_DENIED_REJECTION.code,
    rejection_message: PERMISSION_DENIED_REJECTION.message,
  };
}

async function park_entries(
  database: SportSyncDatabase,
  entries: SyncOutboxEntry[],
): Promise<RejectedOutboxRecord[]> {
  const parked: RejectedOutboxRecord[] = [];
  for (const entry of entries)
    if (
      await mark_outbox_entry_rejected(
        database,
        entry,
        PERMISSION_DENIED_REJECTION,
      )
    )
      parked.push(to_rejected_record(entry));
  return parked;
}

function is_parked_for_permission(entry: SyncOutboxEntry): boolean {
  return (
    entry.status === SyncOutboxEntryStatus.REJECTED &&
    entry.rejection_code === PERMISSION_DENIED_REJECTION.code
  );
}

async function requeue_newly_permitted_entries(
  database: SportSyncDatabase,
  role: UserRole,
  correlation_id: string,
): Promise<number> {
  const rejected = await outbox_table(database)
    .where(STATUS_INDEX)
    .equals(SyncOutboxEntryStatus.REJECTED)
    .toArray();
  const permitted = rejected.filter(
    (entry) =>
      is_parked_for_permission(entry) &&
      role_can_push_operation(role, entry.table_name, entry.operation),
  );
  let requeued_count = 0;
  for (const entry of permitted)
    if (
      (
        await requeue_rejected_change(
          database,
          entry.table_name,
          entry.local_id,
        )
      ).success
    )
      requeued_count += 1;
  if (requeued_count > 0)
    console.log("[Sync] Requeued changes the account may now push", {
      event: "sync_outbox_permitted_changes_requeued",
      correlation_id,
      requeued_count,
    });
  return requeued_count;
}

async function park_unpermitted_pending_entries(
  database: SportSyncDatabase,
  role: UserRole,
): Promise<RejectedOutboxRecord[]> {
  const pending = await outbox_table(database)
    .where(STATUS_INDEX)
    .equals(SyncOutboxEntryStatus.PENDING)
    .toArray();
  return park_entries(
    database,
    pending.filter(
      (entry) =>
        !role_can_push_operation(role, entry.table_name, entry.operation),
    ),
  );
}

export async function reject_unpermitted_pending_entries(
  database: SportSyncDatabase,
  role: UserRole,
  correlation_id: string,
): AsyncResult<RejectedOutboxRecord[]> {
  try {
    await requeue_newly_permitted_entries(database, role, correlation_id);
    const parked = await park_unpermitted_pending_entries(database, role);
    if (parked.length > 0)
      console.warn("[Sync] Parked changes this account may not push", {
        event: "sync_outbox_unpermitted_changes_rejected",
        correlation_id,
        rejected_count: parked.length,
      });
    return create_success_result(parked);
  } catch (error) {
    console.error("[Sync] Failed to check outbox permissions", {
      event: "sync_outbox_permission_check_failed",
      correlation_id,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}
