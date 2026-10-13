import { SYNC_WRITE_REJECTION_MESSAGES } from "$convex/lib/sync_write_decision";
import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { type Option, OptionStatus } from "$lib/core/types/Option";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  confirm_outbox_entry,
  mark_outbox_entry_conflicted,
  mark_outbox_entry_rejected,
} from "./syncOutboxEntryUpdates";
import {
  convert_server_record_to_remote_change,
  type RemoteApplyDependencies,
} from "./syncRemoteApply";
import {
  apply_resolved_remote_record,
  ResolvedRecordGuardKind,
} from "./syncRemoteApplyRecords";

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

const MISSING_REMOTE_COPY_ERROR =
  "Server reported a delete conflict without sending its copy of the record";

export const PushOutcomeKind = {
  CONFIRMED: "confirmed",
  CONFLICTED: "conflicted",
  DELETED_REMOTELY: "deleted_remotely",
  REJECTED: "rejected",
  SUPERSEDED_BY_REMOTE: "superseded_by_remote",
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
    case PushOutcomeKind.SUPERSEDED_BY_REMOTE:
      await mark_outbox_entry_rejected(dependencies.database, entry, {
        code: result.action,
        message: describe_rejection(result.action),
      });
      return PushOutcomeKind.REJECTED;
  }
}

async function restore_remote_copy_after_lost_delete(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
  remote_copy: Option<Record<string, unknown>>,
): Promise<Result<PushOutcomeKindValue>> {
  if (remote_copy.status === OptionStatus.NONE)
    return create_failure_result(MISSING_REMOTE_COPY_ERROR);
  await apply_resolved_remote_record(
    dependencies,
    entry.table_name,
    {
      ...convert_server_record_to_remote_change({
        ...remote_copy.value,
        local_id: entry.local_id,
      }),
      server_version: result.server_version,
    },
    {
      kind: ResolvedRecordGuardKind.CHANGE_TOKEN,
      change_token: entry.change_token,
    },
  );
  return create_success_result(PushOutcomeKind.SUPERSEDED_BY_REMOTE);
}

export async function settle_delete_result(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
  remote_copy: Option<Record<string, unknown>>,
): Promise<Result<PushOutcomeKindValue>> {
  const outcome = classify_server_result(result);
  switch (outcome) {
    case PushOutcomeKind.CONFIRMED:
      await confirm_outbox_entry(
        dependencies.database,
        entry,
        result.server_version,
      );
      return create_success_result(outcome);
    case PushOutcomeKind.CONFLICTED:
      return restore_remote_copy_after_lost_delete(
        dependencies,
        entry,
        result,
        remote_copy,
      );
    case PushOutcomeKind.DELETED_REMOTELY:
    case PushOutcomeKind.REJECTED:
    case PushOutcomeKind.SUPERSEDED_BY_REMOTE:
      await mark_outbox_entry_rejected(dependencies.database, entry, {
        code: result.action,
        message: describe_rejection(result.action),
      });
      return create_success_result(PushOutcomeKind.REJECTED);
  }
}
