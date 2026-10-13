import type { SyncHints } from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import {
  get_sync_manager,
  type SyncDirection,
  type SyncProgress,
  type SyncResult,
} from "$lib/infrastructure/sync/convexSyncService";
import { conflict_store } from "$lib/presentation/stores/conflictStore";
import { sync_review_store } from "$lib/presentation/stores/conflictStoreSyncReviewInstance";

import { execute_conflict_resolution } from "./syncStoreResolveConflict";
import {
  build_unexpected_failure_result,
  resolve_sync_error_state,
} from "./syncStoreResults";
import {
  create_recorded_last_sync_result_state,
  create_recorded_last_sync_time_state,
  SyncErrorStatus,
  SyncProgressStatus,
  type SyncState,
} from "./syncStoreTypes";

type SyncStateUpdater = (updater: (state: SyncState) => SyncState) => void;

const SYNC_UNEXPECTED_FAILURE_MESSAGE = "Sync failed unexpectedly";
const SYNCING_STATUS = "syncing";

function apply_sync_progress(
  update: SyncStateUpdater,
  progress: SyncProgress,
): boolean {
  update((state) => ({
    ...state,
    current_progress: { status: SyncProgressStatus.ACTIVE, progress },
    is_syncing: progress.status === SYNCING_STATUS,
  }));
  return true;
}

function apply_sync_complete(
  update: SyncStateUpdater,
  result: SyncResult,
): boolean {
  if (!result.success && result.errors.length > 0)
    console.error("[Sync] Sync completed with errors", {
      event: "sync_completed_with_errors",
      error_count: result.errors.length,
    });
  const has_conflicts = result.conflicts && result.conflicts.length > 0;
  for (const table_conflict of has_conflicts ? result.conflicts : [])
    conflict_store.add_conflicts_from_sync_response(
      table_conflict.table_name,
      table_conflict.conflicts,
    );
  sync_review_store.add_from_sync_result(result);
  update((state) => ({
    ...state,
    is_syncing: false,
    last_sync_at: create_recorded_last_sync_time_state(
      new Date().toISOString(),
    ),
    last_sync_result: create_recorded_last_sync_result_state(result),
    current_progress: { status: SyncProgressStatus.IDLE },
    error_message: resolve_sync_error_state(result),
    has_pending_conflicts: has_conflicts,
  }));
  return true;
}

export async function run_sync_now(
  update: SyncStateUpdater,
  direction?: SyncDirection,
  hints?: SyncHints,
): Promise<SyncResult> {
  update((state) => ({
    ...state,
    is_syncing: true,
    error_message: { status: SyncErrorStatus.CLEAR },
    current_progress: { status: SyncProgressStatus.IDLE },
  }));
  try {
    const result = await get_sync_manager().sync_now(
      (progress: SyncProgress) => apply_sync_progress(update, progress),
      direction,
      hints,
    );
    apply_sync_complete(update, result);
    return result;
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : SYNC_UNEXPECTED_FAILURE_MESSAGE;
    console.error("[Sync] Unexpected sync failure", {
      event: "sync_unexpected_failure",
      error: String(error_message),
    });
    const failed_result = build_unexpected_failure_result(error_message);
    apply_sync_complete(update, failed_result);
    return failed_result;
  }
}

export async function run_conflict_resolution(
  update: SyncStateUpdater,
  conflict: ScalarInput<ConflictRecord>,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): Promise<{ success: true } | { success: false; error: string }> {
  const result = await execute_conflict_resolution(
    get_sync_manager().get_convex_client(),
    conflict,
    action,
    merged_data,
  );
  if (result.success)
    update((state) => ({ ...state, has_pending_conflicts: false }));
  return result;
}
