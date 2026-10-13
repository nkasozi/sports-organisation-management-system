import {
  create_known_base_version,
  SyncBaseVersionKind,
  type SyncOutboxEntry,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import { mark_outbox_entry_rejected } from "./syncOutboxEntryUpdates";
import type {
  RejectedOutboxRecord,
  ServerRecordResult,
} from "./syncPushOutcomes";
import type { PushTableOutboxCommand } from "./syncPushTransport";

const CONFLICT_DETECTED_ACTION = "conflict_detected";

const DELETE_NEEDS_REVIEW_REJECTION = {
  code: "delete_needs_review",
  message:
    "This record changed on the server since this device last synced it, so it was not deleted. Discard your delete to keep the saved copy, or retry to delete it anyway.",
} as const;

export function is_delete_conflict_without_known_base(
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): boolean {
  return (
    result.success &&
    result.action === CONFLICT_DETECTED_ACTION &&
    entry.base_version.kind !== SyncBaseVersionKind.KNOWN
  );
}

export async function park_delete_for_review(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): Promise<RejectedOutboxRecord> {
  await mark_outbox_entry_rejected(
    command.database,
    {
      ...entry,
      base_version: create_known_base_version(result.server_version),
    },
    DELETE_NEEDS_REVIEW_REJECTION,
  );
  console.warn("[Sync:Push] Delete of a changed record parked for review", {
    event: "sync_delete_parked_for_review",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    local_id: entry.local_id,
  });
  return {
    table_name: entry.table_name,
    local_id: entry.local_id,
    rejection_code: DELETE_NEEDS_REVIEW_REJECTION.code,
    rejection_message: DELETE_NEEDS_REVIEW_REJECTION.message,
  };
}
