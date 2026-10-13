import type {
  SyncProgress,
  SyncResult,
} from "$lib/infrastructure/sync/convexSyncService";

export const SyncProgressStatus = { IDLE: "idle", ACTIVE: "active" } as const;
const LastSyncTimeStatus = {
  NEVER: "never",
  RECORDED: "recorded",
} as const;
const LastSyncResultStatus = {
  EMPTY: "empty",
  RECORDED: "recorded",
} as const;
export const SyncErrorStatus = { CLEAR: "clear", PRESENT: "present" } as const;

export type SyncProgressState =
  | { status: typeof SyncProgressStatus.IDLE }
  | { status: typeof SyncProgressStatus.ACTIVE; progress: SyncProgress };

export type LastSyncTimeState =
  | { status: typeof LastSyncTimeStatus.NEVER }
  | { status: typeof LastSyncTimeStatus.RECORDED; value: string };

export type LastSyncResultState =
  | { status: typeof LastSyncResultStatus.EMPTY }
  | { status: typeof LastSyncResultStatus.RECORDED; result: SyncResult };

export type SyncErrorState =
  | { status: typeof SyncErrorStatus.CLEAR }
  | { status: typeof SyncErrorStatus.PRESENT; message: string };

export function create_never_last_sync_time_state(): LastSyncTimeState {
  return { status: LastSyncTimeStatus.NEVER };
}

export function create_recorded_last_sync_time_state(
  value: string,
): LastSyncTimeState {
  return { status: LastSyncTimeStatus.RECORDED, value };
}

export function create_empty_last_sync_result_state(): LastSyncResultState {
  return { status: LastSyncResultStatus.EMPTY };
}

export function create_recorded_last_sync_result_state(
  result: SyncResult,
): LastSyncResultState {
  return { status: LastSyncResultStatus.RECORDED, result };
}

export interface SyncState {
  is_configured: boolean;
  is_syncing: boolean;
  last_sync_at: LastSyncTimeState;
  last_sync_result: LastSyncResultState;
  current_progress: SyncProgressState;
  error_message: SyncErrorState;
  has_pending_conflicts: boolean;
}

export const SYNC_INITIAL_STATE: SyncState = {
  is_configured: false,
  is_syncing: false,
  last_sync_at: create_never_last_sync_time_state(),
  last_sync_result: create_empty_last_sync_result_state(),
  current_progress: { status: SyncProgressStatus.IDLE },
  error_message: { status: SyncErrorStatus.CLEAR },
  has_pending_conflicts: false,
};
