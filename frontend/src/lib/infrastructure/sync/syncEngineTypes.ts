export const SyncEngineStatus = {
  STOPPED: "stopped",
  IDLE: "idle",
  DEBOUNCING: "debouncing",
  SYNCING: "syncing",
  OFFLINE_WAITING: "offline_waiting",
  FAILED: "failed",
  SUSPENDED: "suspended",
  WAITING_TO_RETRY: "waiting_to_retry",
} as const;

export const SyncRetryReason = {
  SERVER_BACKFILL: "server_backfill",
  ANOTHER_SYNC_RUNNING: "another_sync_running",
} as const;

export type SyncRetryReasonValue =
  (typeof SyncRetryReason)[keyof typeof SyncRetryReason];

export const SyncRunKind = {
  PUSH: "push",
  FULL: "full",
} as const;

export type SyncRunKindValue = (typeof SyncRunKind)[keyof typeof SyncRunKind];

export const SyncFollowUp = {
  NONE: "none",
  PUSH: "push",
  FULL: "full",
} as const;

export type SyncFollowUpValue =
  (typeof SyncFollowUp)[keyof typeof SyncFollowUp];

export type SyncEngineState =
  | {
      status: typeof SyncEngineStatus.STOPPED;
      queued_follow_up: SyncFollowUpValue;
    }
  | { status: typeof SyncEngineStatus.IDLE }
  | { status: typeof SyncEngineStatus.DEBOUNCING }
  | {
      status: typeof SyncEngineStatus.SYNCING;
      run_id: string;
      run_kind: SyncRunKindValue;
      follow_up: SyncFollowUpValue;
      attempt: number;
    }
  | { status: typeof SyncEngineStatus.OFFLINE_WAITING }
  | {
      status: typeof SyncEngineStatus.FAILED;
      retry_at: number;
      attempt: number;
      retry_run_kind: SyncRunKindValue;
    }
  | {
      status: typeof SyncEngineStatus.SUSPENDED;
      queued_follow_up: SyncFollowUpValue;
    }
  | {
      status: typeof SyncEngineStatus.WAITING_TO_RETRY;
      reason: SyncRetryReasonValue;
      retry_at: number;
      retry_run_kind: SyncRunKindValue;
    };

export interface SyncEngineMachine {
  state: SyncEngineState;
  is_online: boolean;
}

export const SyncEngineEventType = {
  START: "start",
  STOP: "stop",
  SUSPEND: "suspend",
  RESUME: "resume",
  LOCAL_CHANGE_RECORDED: "local_change_recorded",
  DEBOUNCE_ELAPSED: "debounce_elapsed",
  PUSH_REQUESTED: "push_requested",
  FULL_SYNC_REQUESTED: "full_sync_requested",
  RUN_SUCCEEDED: "run_succeeded",
  RUN_FAILED: "run_failed",
  RUN_SKIPPED: "run_skipped",
  RUN_DEFERRED: "run_deferred",
  RETRY_ELAPSED: "retry_elapsed",
  WENT_ONLINE: "went_online",
  WENT_OFFLINE: "went_offline",
} as const;

interface RunStartingEvent {
  next_run_id: string;
}

export type SyncEngineEvent =
  | { type: typeof SyncEngineEventType.START; is_online: boolean }
  | { type: typeof SyncEngineEventType.STOP }
  | { type: typeof SyncEngineEventType.SUSPEND }
  | { type: typeof SyncEngineEventType.RESUME }
  | { type: typeof SyncEngineEventType.LOCAL_CHANGE_RECORDED }
  | ({ type: typeof SyncEngineEventType.DEBOUNCE_ELAPSED } & RunStartingEvent)
  | ({ type: typeof SyncEngineEventType.PUSH_REQUESTED } & RunStartingEvent)
  | ({
      type: typeof SyncEngineEventType.FULL_SYNC_REQUESTED;
    } & RunStartingEvent)
  | ({
      type: typeof SyncEngineEventType.RUN_SUCCEEDED;
      run_id: string;
    } & RunStartingEvent)
  | { type: typeof SyncEngineEventType.RUN_FAILED; run_id: string; now: number }
  | { type: typeof SyncEngineEventType.RUN_SKIPPED; run_id: string }
  | {
      type: typeof SyncEngineEventType.RUN_DEFERRED;
      run_id: string;
      reason: SyncRetryReasonValue;
      retry_at: number;
    }
  | ({ type: typeof SyncEngineEventType.RETRY_ELAPSED } & RunStartingEvent)
  | ({ type: typeof SyncEngineEventType.WENT_ONLINE } & RunStartingEvent)
  | { type: typeof SyncEngineEventType.WENT_OFFLINE };

export const SyncEngineEffectType = {
  SCHEDULE_DEBOUNCE: "schedule_debounce",
  CANCEL_DEBOUNCE: "cancel_debounce",
  BEGIN_RUN: "begin_run",
  SCHEDULE_RETRY: "schedule_retry",
  CANCEL_RETRY: "cancel_retry",
  SETTLE_WAITERS: "settle_waiters",
  CANCEL_RUN: "cancel_run",
} as const;

export type SyncEngineEffect =
  | { type: typeof SyncEngineEffectType.SCHEDULE_DEBOUNCE }
  | { type: typeof SyncEngineEffectType.CANCEL_DEBOUNCE }
  | {
      type: typeof SyncEngineEffectType.BEGIN_RUN;
      run_id: string;
      run_kind: SyncRunKindValue;
    }
  | { type: typeof SyncEngineEffectType.SCHEDULE_RETRY; retry_at: number }
  | { type: typeof SyncEngineEffectType.CANCEL_RETRY }
  | { type: typeof SyncEngineEffectType.SETTLE_WAITERS; succeeded: boolean }
  | { type: typeof SyncEngineEffectType.CANCEL_RUN };

export interface SyncEngineTransition {
  machine: SyncEngineMachine;
  effects: SyncEngineEffect[];
}

export const SYNC_RETRY_BASE_DELAY_MS = 5_000;
export const SYNC_RETRY_MAX_DELAY_MS = 300_000;
