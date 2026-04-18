import type {
  SyncProgress,
  SyncResult,
} from "$lib/infrastructure/sync/convexSyncService";

export type SyncProgressState =
  | { status: "idle" }
  | { status: "active"; progress: SyncProgress };

export type LastSyncTimeState =
  | { status: "never" }
  | { status: "recorded"; value: string };

export type LastSyncResultState =
  | { status: "empty" }
  | { status: "recorded"; result: SyncResult };

export type SyncErrorState =
  | { status: "clear" }
  | { status: "present"; message: string };

export function create_never_last_sync_time_state(): LastSyncTimeState {
  return { status: "never" };
}

export function create_recorded_last_sync_time_state(
  value: string,
): LastSyncTimeState {
  return { status: "recorded", value };
}

export function create_empty_last_sync_result_state(): LastSyncResultState {
  return { status: "empty" };
}

export function create_recorded_last_sync_result_state(
  result: SyncResult,
): LastSyncResultState {
  return { status: "recorded", result };
}

export interface SyncState {
  is_configured: boolean;
  is_syncing: boolean;
  last_sync_at: LastSyncTimeState;
  last_sync_result: LastSyncResultState;
  current_progress: SyncProgressState;
  auto_sync_enabled: boolean;
  error_message: SyncErrorState;
  has_pending_conflicts: boolean;
}

export const SYNC_INITIAL_STATE: SyncState = {
  is_configured: false,
  is_syncing: false,
  last_sync_at: create_never_last_sync_time_state(),
  last_sync_result: create_empty_last_sync_result_state(),
  current_progress: { status: "idle" },
  auto_sync_enabled: false,
  error_message: { status: "clear" },
  has_pending_conflicts: false,
};
