import type { AsyncResult, Result } from "$lib/core/types/Result";

import {
  run_with_timeout,
  SESSION_OPERATION_TIMEOUT_MS,
  TIMED_OPERATION_STATUS,
  type TimedOperationOutcome,
} from "./layoutSessionTimeouts";

export const LOGOUT_WARNING_MODAL_STATE = {
  CHECKING: "checking",
  SYNCING: "syncing",
  DISCARD_WARNING: "discard_warning",
  COUNT_UNAVAILABLE: "count_unavailable",
  READY_TO_SIGN_OUT: "ready_to_sign_out",
} as const;

export const LOGOUT_DISCARD_REASON = {
  OFFLINE: "offline",
  SYNC_FAILED: "sync_failed",
  SYNC_STOPPED: "sync_stopped",
} as const;

type LogoutDiscardReason =
  (typeof LOGOUT_DISCARD_REASON)[keyof typeof LOGOUT_DISCARD_REASON];

export type LogoutWarningModalView =
  | { state: typeof LOGOUT_WARNING_MODAL_STATE.CHECKING }
  | { state: typeof LOGOUT_WARNING_MODAL_STATE.SYNCING }
  | {
      state: typeof LOGOUT_WARNING_MODAL_STATE.DISCARD_WARNING;
      unsynced_change_count: number;
      reason: LogoutDiscardReason;
    }
  | { state: typeof LOGOUT_WARNING_MODAL_STATE.COUNT_UNAVAILABLE }
  | { state: typeof LOGOUT_WARNING_MODAL_STATE.READY_TO_SIGN_OUT };

export interface LogoutWarningSyncPort {
  get_unsynced_local_change_count(): AsyncResult<number>;
  is_online(): boolean;
  flush_pending_changes(): AsyncResult<{ skipped_offline: boolean }>;
}

const STATE = LOGOUT_WARNING_MODAL_STATE;
const LOGOUT_WARNING_EVENT = {
  COUNT_FAILED: "logout_warning_count_failed",
  DISCARD_WARNING_SHOWN: "logout_warning_discard_shown",
} as const;
const SINGLE_CHANGE_TEXT = {
  noun: "change that has",
  pronoun: "it",
} as const;
const MULTIPLE_CHANGES_TEXT = {
  noun: "changes that have",
  pronoun: "them",
} as const;

export const LOGOUT_WARNING_TEXT = {
  DISCARD_TITLE: "Unsynced changes will be lost",
  DISCARD_CONFIRM: "Sign out and discard",
  CANCEL: "Cancel",
  COUNT_UNAVAILABLE_TITLE: "Unsynced changes could not be checked",
  COUNT_UNAVAILABLE_MESSAGE:
    "We could not check this device for changes that still need to sync. Signing out now may permanently delete them from this device.",
  COUNT_UNAVAILABLE_CONFIRM: "Sign out anyway",
  STOP_SYNCING: "Stop syncing",
} as const;

export function build_logout_discard_message(
  unsynced_change_count: number,
): string {
  const text =
    unsynced_change_count === 1 ? SINGLE_CHANGE_TEXT : MULTIPLE_CHANGES_TEXT;
  return `You have ${unsynced_change_count} ${text.noun} not been synced. Signing out will permanently delete ${text.pronoun} from this device.`;
}

function build_view_from_count(
  count_result: Result<number>,
  reason: LogoutDiscardReason,
): LogoutWarningModalView {
  if (!count_result.success) {
    console.warn("[LogoutWarning] Unsynced change count unavailable", {
      event: LOGOUT_WARNING_EVENT.COUNT_FAILED,
      error: count_result.error,
    });
    return { state: STATE.COUNT_UNAVAILABLE };
  }
  if (count_result.data === 0) return { state: STATE.READY_TO_SIGN_OUT };
  console.warn("[LogoutWarning] Unsynced changes would be discarded", {
    event: LOGOUT_WARNING_EVENT.DISCARD_WARNING_SHOWN,
    unsynced_change_count: count_result.data,
    reason,
  });
  return {
    state: STATE.DISCARD_WARNING,
    unsynced_change_count: count_result.data,
    reason,
  };
}

interface LogoutSyncStopControl {
  stopped: Promise<typeof LOGOUT_DISCARD_REASON.SYNC_STOPPED>;
  stop(): boolean;
}

type FlushOutcome = TimedOperationOutcome<Result<{ skipped_offline: boolean }>>;

export function create_logout_sync_stop_control(): LogoutSyncStopControl {
  const resolver = { stop: (): boolean => false };
  const stopped = new Promise<typeof LOGOUT_DISCARD_REASON.SYNC_STOPPED>(
    (resolve) => {
      resolver.stop = (): boolean => {
        resolve(LOGOUT_DISCARD_REASON.SYNC_STOPPED);
        return true;
      };
    },
  );
  return { stopped, stop: () => resolver.stop() };
}

function resolve_discard_reason(
  flush_outcome: FlushOutcome,
): LogoutDiscardReason {
  if (flush_outcome.status !== TIMED_OPERATION_STATUS.COMPLETED)
    return LOGOUT_DISCARD_REASON.SYNC_FAILED;
  const flush_result = flush_outcome.value;
  return flush_result.success && flush_result.data.skipped_offline
    ? LOGOUT_DISCARD_REASON.OFFLINE
    : LOGOUT_DISCARD_REASON.SYNC_FAILED;
}

async function sync_before_logout(
  sync_port: LogoutWarningSyncPort,
  stop_control: LogoutSyncStopControl,
): Promise<LogoutWarningModalView> {
  const outcome = await Promise.race([
    run_with_timeout(
      sync_port.flush_pending_changes(),
      SESSION_OPERATION_TIMEOUT_MS.LOGOUT_SYNC,
    ),
    stop_control.stopped,
  ]);
  const reason =
    outcome === LOGOUT_DISCARD_REASON.SYNC_STOPPED
      ? outcome
      : resolve_discard_reason(outcome);
  return build_view_from_count(
    await sync_port.get_unsynced_local_change_count(),
    reason,
  );
}

export function evaluate_logout_request(
  sync_port: LogoutWarningSyncPort,
  on_syncing: () => boolean,
): Promise<LogoutWarningModalView> {
  return evaluate_logout_request_with_stop(
    sync_port,
    on_syncing,
    create_logout_sync_stop_control(),
  );
}

export async function evaluate_logout_request_with_stop(
  sync_port: LogoutWarningSyncPort,
  on_syncing: () => boolean,
  stop_control: LogoutSyncStopControl,
): Promise<LogoutWarningModalView> {
  const count_result = await sync_port.get_unsynced_local_change_count();
  if (!count_result.success || count_result.data === 0)
    return build_view_from_count(count_result, LOGOUT_DISCARD_REASON.OFFLINE);
  if (!sync_port.is_online())
    return build_view_from_count(count_result, LOGOUT_DISCARD_REASON.OFFLINE);
  on_syncing();
  return sync_before_logout(sync_port, stop_control);
}
