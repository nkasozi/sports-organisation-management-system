import {
  create_known_base_version,
  type SyncOutboxEntry,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import { mark_outbox_entry_rejected } from "./syncOutboxEntryUpdates";
import type {
  RejectedOutboxRecord,
  ServerRecordResult,
} from "./syncPushOutcomes";
import type { PushTableOutboxCommand } from "./syncPushTransport";

const CONFLICT_DETECTED_ACTION = "conflict_detected";

interface ReviewRejection {
  code: string;
  message: string;
}

interface ReviewParking {
  rejection: ReviewRejection;
  parked_event: string;
  superseded_event: string;
}

export const DELETE_REVIEW_PARKING: ReviewParking = {
  rejection: {
    code: "delete_needs_review",
    message:
      "This record changed on the server since this device last synced it, so it was not deleted. Discard your delete to keep the saved copy, or retry to delete it anyway.",
  },
  parked_event: "sync_delete_parked_for_review",
  superseded_event: "sync_delete_review_superseded_by_local_change",
};

export const HIDDEN_DELETE_REVIEW_PARKING: ReviewParking = {
  rejection: {
    code: "delete_remote_hidden",
    message:
      "The server copy changed and isn't visible to your account, so it was not deleted. Retry to delete it anyway, or discard your delete.",
  },
  parked_event: "sync_hidden_delete_parked_for_review",
  superseded_event: "sync_hidden_delete_review_superseded_by_local_change",
};

export const HIDDEN_UPSERT_REVIEW_PARKING: ReviewParking = {
  rejection: {
    code: "conflict_remote_hidden",
    message:
      "The server copy changed and isn't visible to your account. Keep your changes to overwrite it, or discard them to remove this record from this device.",
  },
  parked_event: "sync_hidden_conflict_parked_for_review",
  superseded_event: "sync_hidden_conflict_review_superseded_by_local_change",
};

export function is_delete_conflict(result: ServerRecordResult): boolean {
  return result.success && result.action === CONFLICT_DETECTED_ACTION;
}

export async function park_change_for_review(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
  parking: ReviewParking,
): Promise<RejectedOutboxRecord[]> {
  const parked = await mark_outbox_entry_rejected(
    command.database,
    {
      ...entry,
      base_version: create_known_base_version(result.server_version),
    },
    parking.rejection,
  );
  console.warn("[Sync:Push] Change parked for review", {
    event: parked ? parking.parked_event : parking.superseded_event,
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    local_id: entry.local_id,
  });
  if (!parked) return [];
  return [
    {
      table_name: entry.table_name,
      local_id: entry.local_id,
      rejection_code: parking.rejection.code,
      rejection_message: parking.rejection.message,
    },
  ];
}
