import type { AsyncResult, Result } from "$lib/core/types/Result";
import type { SyncResult } from "$lib/infrastructure/sync/syncTypes";
import type { ConvexUserProfile } from "$lib/presentation/stores/authTypes";
import type { SessionSyncNoticeKind } from "$lib/presentation/stores/sessionSyncNotice";
import type { SyncProgressState } from "$lib/presentation/stores/syncStoreTypes";

import type { LoginLocalChangeGuardDependencies } from "./layoutLoginLocalChangeGuard";

interface InitialSyncStateSnapshot {
  is_syncing: boolean;
}

export interface InitialSyncStorePort {
  start_sync(): void;
  update_progress(message: string, percentage: number): void;
  complete_sync(): Promise<void>;
  reset(): void;
  get_state(): InitialSyncStateSnapshot;
}

export interface AuthStorePort {
  reset_initialized_state(): void;
  initialize(): Promise<unknown>;
}

export interface SyncStorePort {
  subscribe(
    handler: (state: { current_progress: SyncProgressState }) => void,
  ): () => void;
  sync_now(direction: "pull"): Promise<SyncResult>;
}

export interface LayoutLoginSyncDependencies extends LoginLocalChangeGuardDependencies {
  initial_sync_store: InitialSyncStorePort;
  auth_store: AuthStorePort;
  sync_store: SyncStorePort;
  stop_background_sync(): Promise<unknown>;
  start_background_sync(): void;
  reset_database(): Promise<unknown>;
  reset_sync_metadata(): Promise<unknown>;
  fetch_current_user_profile_from_convex(): Promise<Result<ConvexUserProfile>>;
  set_pulling_from_remote(value: boolean): void;
  write_convex_user_to_local_dexie(
    profile: ConvexUserProfile,
  ): Promise<unknown>;
  pull_user_scoped_record_from_convex(
    table_name: string,
    record_id: string,
  ): Promise<unknown>;
  sign_out(): Promise<unknown>;
  sign_out_and_tear_down_device(landing_path: string): AsyncResult<boolean>;
  show_session_notice(kind: SessionSyncNoticeKind): boolean;
  goto(path: string): Promise<void>;
  delay(milliseconds: number): Promise<void>;
}
