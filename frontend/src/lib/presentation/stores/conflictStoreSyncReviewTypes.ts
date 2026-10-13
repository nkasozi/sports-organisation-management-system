import type { AsyncResult } from "$lib/core/types/Result";
import type { RejectedChange } from "$lib/infrastructure/sync/syncOutboxReview";

export const SyncReviewItemKind = {
  REMOTE_DELETION: "remote_deletion",
  REJECTED_CHANGE: "rejected_change",
} as const;

export const SyncReviewDecision = {
  KEEP_MINE: "keep_mine",
  DISCARD_MINE: "discard_mine",
} as const;

export type SyncReviewDecisionValue =
  (typeof SyncReviewDecision)[keyof typeof SyncReviewDecision];

interface SyncReviewItemFields {
  id: string;
  table_name: string;
  local_id: string;
  entity_display_name: string;
}

export type SyncReviewItem =
  | (SyncReviewItemFields & {
      kind: typeof SyncReviewItemKind.REMOTE_DELETION;
      deleted_at: string;
    })
  | (SyncReviewItemFields & {
      kind: typeof SyncReviewItemKind.REJECTED_CHANGE;
      rejection_message: string;
    });

export const SyncReviewActionStatus = {
  IDLE: "idle",
  WORKING: "working",
  FAILED: "failed",
} as const;

export type SyncReviewActionState =
  | { status: typeof SyncReviewActionStatus.IDLE }
  | { status: typeof SyncReviewActionStatus.WORKING; item_id: string }
  | {
      status: typeof SyncReviewActionStatus.FAILED;
      item_id: string;
      message: string;
    };

export interface SyncReviewState {
  items: SyncReviewItem[];
  action_state: SyncReviewActionState;
  is_visible: boolean;
}

export const INITIAL_SYNC_REVIEW_STATE: SyncReviewState = {
  items: [],
  action_state: { status: SyncReviewActionStatus.IDLE },
  is_visible: false,
};

type RecordAction = (
  table_name: string,
  local_id: string,
) => AsyncResult<boolean>;

export interface SyncReviewDependencies {
  restore_remotely_deleted: RecordAction;
  discard_remotely_deleted: RecordAction;
  retry_rejected: RecordAction;
  discard_rejected: RecordAction;
  requeue_conflicts(): Promise<number>;
  list_rejected(): Promise<RejectedChange[]>;
  request_push(): boolean;
}
