import { type Readable, writable } from "svelte/store";

import {
  type AsyncResult,
  create_failure_result,
  type Result,
} from "$lib/core/types/Result";
import type { SyncResult } from "$lib/infrastructure/sync/syncTypes";

import {
  build_rejected_change_item,
  build_remote_deletion_item,
  collect_sync_result_items,
  mark_failed,
  mark_resolved,
  mark_working,
  merge_review_items,
} from "./conflictStoreSyncReviewItems";
import {
  INITIAL_SYNC_REVIEW_STATE,
  SyncReviewDecision,
  type SyncReviewDecisionValue,
  type SyncReviewDependencies,
  type SyncReviewItem,
  SyncReviewItemKind,
  type SyncReviewState,
} from "./conflictStoreSyncReviewTypes";

interface PlannedDecision {
  run(): AsyncResult<boolean>;
  needs_push: boolean;
}

function plan_decision(
  dependencies: SyncReviewDependencies,
  item: SyncReviewItem,
  decision: SyncReviewDecisionValue,
): PlannedDecision {
  const keep = decision === SyncReviewDecision.KEEP_MINE;
  const args = [item.table_name, item.local_id] as const;
  switch (item.kind) {
    case SyncReviewItemKind.REMOTE_DELETION:
      return keep
        ? {
            run: () => dependencies.restore_remotely_deleted(...args),
            needs_push: true,
          }
        : {
            run: () => dependencies.discard_remotely_deleted(...args),
            needs_push: false,
          };
    case SyncReviewItemKind.REJECTED_CHANGE:
      return keep
        ? { run: () => dependencies.retry_rejected(...args), needs_push: true }
        : {
            run: () => dependencies.discard_rejected(...args),
            needs_push: false,
          };
  }
}

async function run_safely(planned: PlannedDecision): AsyncResult<boolean> {
  try {
    return await planned.run();
  } catch (error) {
    return create_failure_result(String(error));
  }
}

function log_decision(
  item: SyncReviewItem,
  decision: SyncReviewDecisionValue,
  result: Result<boolean>,
): boolean {
  const context = {
    item_kind: item.kind,
    table_name: item.table_name,
    local_id: item.local_id,
    decision,
  };
  if (result.success)
    console.log("[SyncReview] Decision applied", {
      event: "sync_review_decision_applied",
      ...context,
    });
  else
    console.error("[SyncReview] Decision failed", {
      event: "sync_review_decision_failed",
      ...context,
      error: result.error,
    });
  return result.success;
}

type ReviewUpdater = (
  updater: (state: SyncReviewState) => SyncReviewState,
) => void;

interface SyncReviewStore {
  subscribe: Readable<SyncReviewState>["subscribe"];
  decide(
    item: SyncReviewItem,
    decision: SyncReviewDecisionValue,
  ): Promise<boolean>;
  add_from_sync_result(result: SyncResult): boolean;
  add_remote_deletion(
    deletion: SyncResult["deleted_remotely"][number],
  ): boolean;
  restore_from_outbox(): Promise<number>;
  show(): boolean;
  dismiss(): boolean;
  reset(): boolean;
}

function create_decide(
  dependencies: SyncReviewDependencies,
  update: ReviewUpdater,
): SyncReviewStore["decide"] {
  return async (item, decision) => {
    update(mark_working(item.id));
    const planned = plan_decision(dependencies, item, decision);
    const succeeded = log_decision(item, decision, await run_safely(planned));
    if (!succeeded) {
      update(mark_failed(item.id));
      return false;
    }
    if (planned.needs_push) dependencies.request_push();
    update(mark_resolved(item.id));
    return true;
  };
}

function create_restore_from_outbox(
  dependencies: SyncReviewDependencies,
  update: ReviewUpdater,
): SyncReviewStore["restore_from_outbox"] {
  return async () => {
    await dependencies.requeue_conflicts();
    const rejected = await dependencies.list_rejected();
    update((state) =>
      merge_review_items(state, rejected.map(build_rejected_change_item)),
    );
    return rejected.length;
  };
}

export function create_sync_review_store(
  dependencies: SyncReviewDependencies,
): SyncReviewStore {
  const { subscribe, update, set } = writable<SyncReviewState>(
    INITIAL_SYNC_REVIEW_STATE,
  );
  return {
    subscribe,
    decide: create_decide(dependencies, update),
    restore_from_outbox: create_restore_from_outbox(dependencies, update),
    add_from_sync_result: (result: SyncResult): boolean => {
      const items = collect_sync_result_items(result);
      update((state) => merge_review_items(state, items));
      return items.length > 0;
    },
    add_remote_deletion: (deletion): boolean => {
      update((state) =>
        merge_review_items(state, [build_remote_deletion_item(deletion)]),
      );
      return true;
    },
    show: (): boolean => {
      update((state) => ({ ...state, is_visible: state.items.length > 0 }));
      return true;
    },
    dismiss: (): boolean => {
      update((state) => ({ ...state, is_visible: false }));
      return true;
    },
    reset: (): boolean => {
      set(INITIAL_SYNC_REVIEW_STATE);
      return true;
    },
  };
}
