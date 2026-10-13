import type { AsyncResult } from "$lib/core/types/Result";

export const LOGOUT_WARNING_MODAL_STATE = {
  CHECKING: "checking",
  WARNING: "warning",
  SYNCING: "syncing",
  SYNC_FAILED: "sync_failed",
  OFFLINE: "offline",
  COUNT_UNAVAILABLE: "count_unavailable",
} as const;

export type LogoutWarningModalState =
  (typeof LOGOUT_WARNING_MODAL_STATE)[keyof typeof LOGOUT_WARNING_MODAL_STATE];

export interface LogoutWarningSyncPort {
  get_unsynced_local_change_count(): AsyncResult<number>;
  is_online(): boolean;
  flush_pending_changes(): AsyncResult<{ skipped_offline: boolean }>;
}

interface LogoutWarningModalDecision {
  modal_state: LogoutWarningModalState;
  should_confirm_logout: boolean;
}

interface LogoutWarningSyncOutcome extends LogoutWarningModalDecision {
  sync_error_message: string;
}

const STATE = LOGOUT_WARNING_MODAL_STATE;
const SYNC_FAILED_MESSAGE =
  "Failed to sync changes to the server. Your local data may be lost if you logout.";
const LOGOUT_WARNING_COUNT_FAILED_EVENT = "logout_warning_count_failed";

export async function get_logout_warning_modal_state(
  sync_port: LogoutWarningSyncPort,
): Promise<LogoutWarningModalDecision> {
  const count_result = await sync_port.get_unsynced_local_change_count();
  if (!count_result.success) {
    console.warn("[LogoutWarning] Unsynced change count unavailable", {
      event: LOGOUT_WARNING_COUNT_FAILED_EVENT,
      error: count_result.error,
    });
    return {
      modal_state: STATE.COUNT_UNAVAILABLE,
      should_confirm_logout: false,
    };
  }
  if (count_result.data === 0)
    return { modal_state: STATE.CHECKING, should_confirm_logout: true };
  return {
    modal_state: sync_port.is_online() ? STATE.WARNING : STATE.OFFLINE,
    should_confirm_logout: false,
  };
}

export async function sync_logout_warning_modal_changes(
  sync_port: LogoutWarningSyncPort,
): Promise<LogoutWarningSyncOutcome> {
  const sync_result = await sync_port.flush_pending_changes();
  if (!sync_result.success)
    return {
      modal_state: STATE.SYNC_FAILED,
      should_confirm_logout: false,
      sync_error_message: SYNC_FAILED_MESSAGE,
    };
  return sync_result.data.skipped_offline
    ? {
        modal_state: STATE.OFFLINE,
        should_confirm_logout: false,
        sync_error_message: "",
      }
    : {
        modal_state: STATE.SYNCING,
        should_confirm_logout: true,
        sync_error_message: "",
      };
}
