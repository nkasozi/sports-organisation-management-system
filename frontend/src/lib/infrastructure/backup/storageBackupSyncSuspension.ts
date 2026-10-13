import type { StorageBackupSyncSuspensionPort } from "./storageBackupContracts";

interface SyncSuspensionState {
  background_sync_was_running: boolean;
  remote_sync_was_running: boolean;
}

export function suspend_sync_for_restore(
  sync_suspension_port: StorageBackupSyncSuspensionPort,
): SyncSuspensionState {
  const background_sync_was_running =
    sync_suspension_port.stop_background_sync();
  const remote_sync_was_running = sync_suspension_port.stop_remote_sync();
  sync_suspension_port.set_pulling_from_remote(true);
  return { background_sync_was_running, remote_sync_was_running };
}

export function resume_sync_after_restore(
  sync_suspension_port: StorageBackupSyncSuspensionPort,
  suspension_state: SyncSuspensionState,
): boolean {
  sync_suspension_port.set_pulling_from_remote(false);

  if (suspension_state.remote_sync_was_running) {
    sync_suspension_port.start_remote_sync();
  }

  if (suspension_state.background_sync_was_running) {
    sync_suspension_port.start_background_sync();
  }

  return true;
}
