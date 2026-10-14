import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult } from "$lib/core/types/Result";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import {
  type ConflictResolutionOutcome,
  ConflictResolutionOutcomeKind,
} from "$lib/infrastructure/sync/syncConflictResolutionOutcome";
import { ServerCopyStatus } from "$lib/infrastructure/sync/syncOutboxReviewServerCopy";
import type { DeletedRemotelyRecord } from "$lib/infrastructure/sync/syncPushTransport";

export const ConflictResolutionFeedbackStatus = {
  RESOLVED: "resolved",
  NEEDS_ATTENTION: "needs_attention",
  MOVED_TO_REVIEW: "moved_to_review",
} as const;

export type ConflictResolutionFeedback =
  | { status: typeof ConflictResolutionFeedbackStatus.RESOLVED }
  | {
      status:
        | typeof ConflictResolutionFeedbackStatus.NEEDS_ATTENTION
        | typeof ConflictResolutionFeedbackStatus.MOVED_TO_REVIEW;
      message: string;
    };

type ServerCopy =
  | { status: typeof ServerCopyStatus.FOUND; record: Record<string, unknown> }
  | { status: typeof ServerCopyStatus.NOT_FOUND };

export interface ConflictOutcomeDependencies {
  mark_resolved(
    conflict_id: string,
    action: ConflictResolutionAction,
    merged_data?: Record<string, unknown>,
  ): boolean;
  refresh_remote_copy(
    conflict_id: string,
    remote_data: Record<string, unknown>,
    remote_version: number,
  ): boolean;
  remove_conflict(conflict_id: string): boolean;
  add_remote_deletion(deletion: DeletedRemotelyRecord): boolean;
  load_server_copy(
    table_name: string,
    local_id: string,
  ): AsyncResult<ServerCopy>;
}

interface ApplyConflictOutcomeCommand {
  conflict: ScalarInput<ConflictRecord>;
  action: ConflictResolutionAction;
  merged_data?: Record<string, unknown>;
  outcome: ConflictResolutionOutcome;
}

const SAVE_FAILED_MESSAGE =
  "We couldn't save your choice. Your changes are still on this device — check your connection and try again.";
const CHANGED_AGAIN_MESSAGE =
  "This record was changed again on the server. We've loaded the latest version — please review it and choose again.";
const DELETED_REMOTELY_MESSAGE =
  "This record was deleted on the server. Choose whether to restore it with your changes or discard them.";

function needs_attention(message: string): ConflictResolutionFeedback {
  return { status: ConflictResolutionFeedbackStatus.NEEDS_ATTENTION, message };
}

function move_to_review(
  dependencies: ConflictOutcomeDependencies,
  conflict: ScalarInput<ConflictRecord>,
  tombstone_version: number,
): ConflictResolutionFeedback {
  dependencies.remove_conflict(conflict.id);
  dependencies.add_remote_deletion({
    table_name: conflict.table_name,
    local_id: conflict.local_id,
    local_data: conflict.local_data,
    tombstone_version,
    deleted_at: new Date().toISOString(),
  });
  return {
    status: ConflictResolutionFeedbackStatus.MOVED_TO_REVIEW,
    message: DELETED_REMOTELY_MESSAGE,
  };
}

async function reload_changed_conflict(
  dependencies: ConflictOutcomeDependencies,
  conflict: ScalarInput<ConflictRecord>,
  server_version: number,
): Promise<ConflictResolutionFeedback> {
  const server_copy = await dependencies.load_server_copy(
    conflict.table_name,
    conflict.local_id,
  );
  if (!server_copy.success) return needs_attention(SAVE_FAILED_MESSAGE);
  switch (server_copy.data.status) {
    case ServerCopyStatus.FOUND:
      dependencies.refresh_remote_copy(
        conflict.id,
        server_copy.data.record,
        server_version,
      );
      return needs_attention(CHANGED_AGAIN_MESSAGE);
    case ServerCopyStatus.NOT_FOUND:
      return move_to_review(dependencies, conflict, server_version);
  }
}

export async function apply_conflict_resolution_outcome(
  dependencies: ConflictOutcomeDependencies,
  command: ApplyConflictOutcomeCommand,
): Promise<ConflictResolutionFeedback> {
  const outcome = command.outcome;
  switch (outcome.kind) {
    case ConflictResolutionOutcomeKind.RESOLVED:
      dependencies.mark_resolved(
        command.conflict.id,
        command.action,
        command.merged_data,
      );
      return { status: ConflictResolutionFeedbackStatus.RESOLVED };
    case ConflictResolutionOutcomeKind.REMOTE_CHANGED_AGAIN:
      return reload_changed_conflict(
        dependencies,
        command.conflict,
        outcome.server_version,
      );
    case ConflictResolutionOutcomeKind.DELETED_REMOTELY:
      return move_to_review(
        dependencies,
        command.conflict,
        outcome.tombstone_version,
      );
    case ConflictResolutionOutcomeKind.FAILED:
      return needs_attention(SAVE_FAILED_MESSAGE);
  }
}
