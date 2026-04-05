import type {
  SyncProgress,
  SyncResult,
} from "$lib/infrastructure/sync/convexSyncService";

export interface SyncState {
  is_configured: boolean;
  is_syncing: boolean;
  last_sync_at: string | null;
  last_sync_result: SyncResult | null;
  current_progress: SyncProgress | null;
  auto_sync_enabled: boolean;
  error_message: string | null;
  has_pending_conflicts: boolean;
}

export const SYNC_INITIAL_STATE: SyncState = {
  is_configured: false,
  is_syncing: false,
  last_sync_at: null,
  last_sync_result: null,
  current_progress: null,
  auto_sync_enabled: false,
  error_message: null,
  has_pending_conflicts: false,
};
