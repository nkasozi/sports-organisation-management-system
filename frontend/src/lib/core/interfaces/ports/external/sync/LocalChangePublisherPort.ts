import type { Result, AsyncResult } from "$lib/core/types/Result";
import type { SyncOrchestratorPort } from "./SyncOrchestratorPort";

export interface SyncRestorationHandlers {
  stop_remote_sync(): Result<boolean>;
  start_remote_sync(): Result<boolean>;
}

export interface LocalSyncStatus {
  is_running: boolean;
  has_pending_changes: boolean;
  is_online: boolean;
}

export interface LocalChangePublisherPort {
  start(): Result<boolean>;
  stop(): Result<boolean>;
  get_status(): LocalSyncStatus;
  set_remote_sync_in_progress(value: boolean): Result<boolean>;
  configure_orchestrator(orchestrator: SyncOrchestratorPort): Result<boolean>;
  configure_restoration_handlers(
    handlers: SyncRestorationHandlers,
  ): Result<boolean>;
  has_pending_changes(): boolean;
  flush_pending_changes(): AsyncResult<{ skipped_offline: boolean }>;
}
