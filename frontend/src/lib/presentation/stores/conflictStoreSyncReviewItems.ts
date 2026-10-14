import { get_entity_display_name } from "$lib/infrastructure/sync/conflictTypes";
import type { RejectedChange } from "$lib/infrastructure/sync/syncOutboxReview";
import type { SyncResult } from "$lib/infrastructure/sync/syncTypes";

import {
  SyncReviewActionStatus,
  type SyncReviewItem,
  SyncReviewItemKind,
  type SyncReviewState,
} from "./conflictStoreSyncReviewTypes";

type RemoteDeletion = SyncResult["deleted_remotely"][number];

function build_review_item_id(table_name: string, local_id: string): string {
  return `${table_name}:${local_id}`;
}

export function build_remote_deletion_item(
  deletion: RemoteDeletion,
): SyncReviewItem {
  return {
    kind: SyncReviewItemKind.REMOTE_DELETION,
    id: build_review_item_id(deletion.table_name, deletion.local_id),
    table_name: deletion.table_name,
    local_id: deletion.local_id,
    entity_display_name: get_entity_display_name(
      deletion.local_data,
      deletion.table_name,
    ),
    deleted_at: deletion.deleted_at,
  };
}

export function build_rejected_change_item(
  rejected: RejectedChange,
): SyncReviewItem {
  return {
    kind: SyncReviewItemKind.REJECTED_CHANGE,
    id: build_review_item_id(rejected.table_name, rejected.local_id),
    table_name: rejected.table_name,
    local_id: rejected.local_id,
    entity_display_name: get_entity_display_name(
      { id: rejected.local_id },
      rejected.table_name,
    ),
    rejection_message: rejected.rejection_message,
  };
}

export function merge_review_items(
  state: SyncReviewState,
  incoming: SyncReviewItem[],
): SyncReviewState {
  if (incoming.length === 0) return state;
  const by_id = new Map(state.items.map((item) => [item.id, item]));
  for (const item of incoming) by_id.set(item.id, item);
  return { ...state, items: [...by_id.values()], is_visible: true };
}

function remove_review_item(
  state: SyncReviewState,
  item_id: string,
): SyncReviewState {
  const items = state.items.filter((item) => item.id !== item_id);
  return { ...state, items, is_visible: state.is_visible && items.length > 0 };
}

const DECISION_FAILED_MESSAGE =
  "We couldn't apply your choice right now. Your change is still saved on this device — please try again.";

export function mark_working(
  item_id: string,
): (state: SyncReviewState) => SyncReviewState {
  return (state) => ({
    ...state,
    action_state: { status: SyncReviewActionStatus.WORKING, item_id },
  });
}

export function mark_failed(
  item_id: string,
): (state: SyncReviewState) => SyncReviewState {
  return (state) => ({
    ...state,
    action_state: {
      status: SyncReviewActionStatus.FAILED,
      item_id,
      message: DECISION_FAILED_MESSAGE,
    },
  });
}

export function mark_resolved(
  item_id: string,
): (state: SyncReviewState) => SyncReviewState {
  return (state) => ({
    ...remove_review_item(state, item_id),
    action_state: { status: SyncReviewActionStatus.IDLE },
  });
}

export function collect_sync_result_items(
  result: SyncResult,
): SyncReviewItem[] {
  return [
    ...result.deleted_remotely.map(build_remote_deletion_item),
    ...result.rejected_records.map(build_rejected_change_item),
  ];
}
