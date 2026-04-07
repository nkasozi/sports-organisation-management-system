import {
  flush_pending_changes,
  get_background_sync_status,
  has_pending_unsynced_changes,
} from "$lib/infrastructure/sync/backgroundSyncService";

export type LogoutWarningModalState =
  | "checking"
  | "warning"
  | "syncing"
  | "sync_failed"
  | "offline";

export function get_logout_warning_modal_state(): {
  modal_state: LogoutWarningModalState;
  should_confirm_logout: boolean;
} {
  const background_sync_status = get_background_sync_status();
  if (
    !background_sync_status.is_online &&
    background_sync_status.has_pending_changes
  ) {
    return { modal_state: "offline", should_confirm_logout: false };
  }
  if (has_pending_unsynced_changes()) {
    return { modal_state: "warning", should_confirm_logout: false };
  }
  return { modal_state: "checking", should_confirm_logout: true };
}

export async function sync_logout_warning_modal_changes(): Promise<{
  modal_state: LogoutWarningModalState;
  should_confirm_logout: boolean;
  sync_error_message: string;
}> {
  const sync_result = await flush_pending_changes();
  if (sync_result.success && sync_result.data.skipped_offline) {
    return {
      modal_state: "offline",
      should_confirm_logout: false,
      sync_error_message: "",
    };
  }
  if (!sync_result.success) {
    return {
      modal_state: "sync_failed",
      should_confirm_logout: false,
      sync_error_message:
        "Failed to sync changes to the server. Your local data may be lost if you logout.",
    };
  }
  return {
    modal_state: "syncing",
    should_confirm_logout: true,
    sync_error_message: "",
  };
}
