import { SYNC_WRITE_REJECTION_MESSAGES } from "$convex/lib/sync_write_decision";
import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import {
  confirm_outbox_entry,
  mark_outbox_entry_conflicted,
  mark_outbox_entry_rejected,
} from "./syncOutboxEntryUpdates";
import type { RemoteApplyDependencies } from "./syncRemoteApply";

const PushResultAction = {
  CREATED: "created",
  UPDATED: "updated",
  SKIPPED: "skipped",
  DELETED: "deleted",
  NOT_FOUND: "not_found",
  CONFLICT_DETECTED: "conflict_detected",
  DELETED_REMOTELY: "deleted_remotely",
} as const;

export const RECORD_TOO_LARGE_REJECTION = {
  code: "record_too_large",
  message:
    "This record is too large to sync. Remove large attachments or images and save it again.",
} as const;

export const PushOutcomeKind = {
  CONFIRMED: "confirmed",
  CONFLICTED: "conflicted",
  DELETED_REMOTELY: "deleted_remotely",
  REJECTED: "rejected",
} as const;

export type PushOutcomeKindValue =
  (typeof PushOutcomeKind)[keyof typeof PushOutcomeKind];

export interface ServerRecordResult {
  local_id: string;
  success: boolean;
  action: string;
  server_version: number;
}

export interface RejectedOutboxRecord {
  table_name: string;
  local_id: string;
  rejection_code: string;
  rejection_message: string;
}

const CONFIRMING_ACTIONS = new Set<string>([
  PushResultAction.CREATED,
  PushResultAction.UPDATED,
  PushResultAction.SKIPPED,
  PushResultAction.DELETED,
  PushResultAction.NOT_FOUND,
]);

function classify_server_result(
  result: ServerRecordResult,
): PushOutcomeKindValue {
  if (!result.success) return PushOutcomeKind.REJECTED;
  if (result.action === PushResultAction.CONFLICT_DETECTED)
    return PushOutcomeKind.CONFLICTED;
  if (result.action === PushResultAction.DELETED_REMOTELY)
    return PushOutcomeKind.DELETED_REMOTELY;
  return CONFIRMING_ACTIONS.has(result.action)
    ? PushOutcomeKind.CONFIRMED
    : PushOutcomeKind.REJECTED;
}

const REJECTION_MESSAGES: Record<string, string> = {
  ...(SYNC_WRITE_REJECTION_MESSAGES as Record<string, string>),
  [RECORD_TOO_LARGE_REJECTION.code]: RECORD_TOO_LARGE_REJECTION.message,
};

function describe_rejection(rejection_code: string): string {
  return REJECTION_MESSAGES[rejection_code] ?? rejection_code;
}

export function build_rejected_record(
  entry: SyncOutboxEntry,
  rejection_code: string,
): RejectedOutboxRecord {
  return {
    table_name: entry.table_name,
    local_id: entry.local_id,
    rejection_code,
    rejection_message: describe_rejection(rejection_code),
  };
}

export async function settle_upsert_result(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): Promise<PushOutcomeKindValue> {
  const outcome = classify_server_result(result);
  switch (outcome) {
    case PushOutcomeKind.CONFIRMED:
      await confirm_outbox_entry(
        dependencies.database,
        entry,
        result.server_version,
      );
      return outcome;
    case PushOutcomeKind.CONFLICTED:
    case PushOutcomeKind.DELETED_REMOTELY:
      await mark_outbox_entry_conflicted(
        dependencies.database,
        entry,
        result.server_version,
      );
      return outcome;
    case PushOutcomeKind.REJECTED:
      await mark_outbox_entry_rejected(dependencies.database, entry, {
        code: result.action,
        message: describe_rejection(result.action),
      });
      return PushOutcomeKind.REJECTED;
  }
}

export async function settle_delete_result(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): Promise<PushOutcomeKindValue> {
  const outcome = classify_server_result(result);
  switch (outcome) {
    case PushOutcomeKind.CONFIRMED:
      await confirm_outbox_entry(
        dependencies.database,
        entry,
        result.server_version,
      );
      return outcome;
    case PushOutcomeKind.CONFLICTED:
    case PushOutcomeKind.DELETED_REMOTELY:
    case PushOutcomeKind.REJECTED:
      await mark_outbox_entry_rejected(dependencies.database, entry, {
        code: result.action,
        message: describe_rejection(result.action),
      });
      return PushOutcomeKind.REJECTED;
  }
}
