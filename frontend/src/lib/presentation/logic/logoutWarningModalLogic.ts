import type { AsyncResult, Result } from "$lib/core/types/Result";

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

async function sync_before_logout(
  sync_port: LogoutWarningSyncPort,
): Promise<LogoutWarningModalView> {
  const flush_result = await sync_port.flush_pending_changes();
  const reason =
    flush_result.success && flush_result.data.skipped_offline
      ? LOGOUT_DISCARD_REASON.OFFLINE
      : LOGOUT_DISCARD_REASON.SYNC_FAILED;
  return build_view_from_count(
    await sync_port.get_unsynced_local_change_count(),
    reason,
  );
}

export async function evaluate_logout_request(
  sync_port: LogoutWarningSyncPort,
  on_syncing: () => boolean,
): Promise<LogoutWarningModalView> {
  const count_result = await sync_port.get_unsynced_local_change_count();
  if (!count_result.success || count_result.data === 0)
    return build_view_from_count(count_result, LOGOUT_DISCARD_REASON.OFFLINE);
  if (!sync_port.is_online())
    return build_view_from_count(count_result, LOGOUT_DISCARD_REASON.OFFLINE);
  on_syncing();
  return sync_before_logout(sync_port);
}
