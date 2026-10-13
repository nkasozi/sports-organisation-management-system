import type { InitialSyncState } from "$lib/presentation/stores/initialSyncStore";

import type { LayoutLoginSyncDependencies } from "./layoutLoginSync";

export function create_layout_login_sync_dependencies(command: {
  initial_sync_store: {
    start_sync(): void;
    update_progress(message: string, percentage: number): void;
    complete_sync(): Promise<void>;
    reset(): void;
  };
  get_initial_sync_state(): InitialSyncState;
  auth_store: LayoutLoginSyncDependencies["auth_store"];
  sync_store: LayoutLoginSyncDependencies["sync_store"];
  stop_background_sync: LayoutLoginSyncDependencies["stop_background_sync"];
  start_background_sync: LayoutLoginSyncDependencies["start_background_sync"];
  reset_database: LayoutLoginSyncDependencies["reset_database"];
  reset_sync_metadata: LayoutLoginSyncDependencies["reset_sync_metadata"];
  fetch_current_user_profile_from_convex: LayoutLoginSyncDependencies["fetch_current_user_profile_from_convex"];
  set_pulling_from_remote: LayoutLoginSyncDependencies["set_pulling_from_remote"];
  write_convex_user_to_local_dexie: LayoutLoginSyncDependencies["write_convex_user_to_local_dexie"];
  pull_user_scoped_record_from_convex: LayoutLoginSyncDependencies["pull_user_scoped_record_from_convex"];
  sign_out: LayoutLoginSyncDependencies["sign_out"];
  sign_out_and_tear_down_device: LayoutLoginSyncDependencies["sign_out_and_tear_down_device"];
  show_session_notice: LayoutLoginSyncDependencies["show_session_notice"];
  goto: LayoutLoginSyncDependencies["goto"];
  delay: LayoutLoginSyncDependencies["delay"];
  get_unsynced_local_change_count: LayoutLoginSyncDependencies["get_unsynced_local_change_count"];
  confirm_discard_unsynced_local_changes: LayoutLoginSyncDependencies["confirm_discard_unsynced_local_changes"];
  read_session_sync_state: LayoutLoginSyncDependencies["read_session_sync_state"];
  get_active_clerk_identity: LayoutLoginSyncDependencies["get_active_clerk_identity"];
  flush_pending_changes: LayoutLoginSyncDependencies["flush_pending_changes"];
}): LayoutLoginSyncDependencies {
  return {
    ...command,
    initial_sync_store: {
      ...command.initial_sync_store,
      get_state: () => command.get_initial_sync_state(),
    },
  };
}
