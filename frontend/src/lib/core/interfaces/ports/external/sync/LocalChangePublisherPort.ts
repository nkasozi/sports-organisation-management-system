import type { Result } from "$lib/core/types/Result";

export interface SyncRestorationHandlers {
  stop_remote_sync(): Result<boolean>;
  start_remote_sync(): Result<boolean>;
}

export interface LocalSyncStatus {
  is_running: boolean;
  has_pending_changes: boolean;
  is_online: boolean;
}
