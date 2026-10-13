import {
  flush_pending_changes,
  get_background_sync_status,
  get_unsynced_local_change_count,
} from "$lib/infrastructure/sync/backgroundSyncService";

import type { LogoutWarningSyncPort } from "./logoutWarningModalLogic";

export function create_runtime_logout_warning_sync_port(): LogoutWarningSyncPort {
  return {
    get_unsynced_local_change_count,
    is_online: () => get_background_sync_status().is_online,
    flush_pending_changes,
  };
}
