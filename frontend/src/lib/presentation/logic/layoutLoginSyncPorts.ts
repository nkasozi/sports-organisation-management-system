import type { AsyncResult, Result } from "$lib/core/types/Result";
import type {
  LocalVaultMode,
  PendingLocalVaultKey,
} from "$lib/infrastructure/localVault/localVaultContracts";
import type { SyncResult } from "$lib/infrastructure/sync/syncTypes";
import type { ConvexUserProfile } from "$lib/presentation/stores/authTypes";
import type { SessionSyncNoticeKind } from "$lib/presentation/stores/sessionSyncNotice";
import type { SessionSyncRetryKind } from "$lib/presentation/stores/sessionSyncRetryNotice";
import type { SyncProgressState } from "$lib/presentation/stores/syncStoreTypes";

import type { LocalVaultProtectionResolution } from "./localVaultPromptGate";

interface InitialSyncStateSnapshot {
  is_syncing: boolean;
}

export const LOGIN_PROFILE_LOOKUP_STATUS = {
  FOUND: "found",
  NOT_FOUND: "not_found",
  UNAVAILABLE: "unavailable",
} as const;

export type LoginProfileLookup =
  | {
      status: typeof LOGIN_PROFILE_LOOKUP_STATUS.FOUND;
      profile: ConvexUserProfile;
    }
  | { status: typeof LOGIN_PROFILE_LOOKUP_STATUS.NOT_FOUND; error: string }
  | { status: typeof LOGIN_PROFILE_LOOKUP_STATUS.UNAVAILABLE; error: string };

export interface InitialSyncStorePort {
  start_sync(): void;
  update_progress(message: string, percentage: number): void;
  complete_sync(): AsyncResult<boolean>;
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

export interface LayoutLoginSyncDependencies {
  initial_sync_store: InitialSyncStorePort;
  auth_store: AuthStorePort;
  sync_store: SyncStorePort;
  stop_background_sync(): Promise<unknown>;
  start_background_sync(): void;
  start_realtime_sync(): boolean;
  reset_database(): Promise<unknown>;
  protect_local_data_for_sign_in(
    owner_label: string,
  ): Promise<LocalVaultProtectionResolution>;
  activate_local_vault(
    pending: PendingLocalVaultKey,
  ): AsyncResult<LocalVaultMode>;
  reset_sync_metadata(): Promise<unknown>;
  look_up_current_user_profile(): Promise<LoginProfileLookup>;
  set_pulling_from_remote(value: boolean): void;
  write_convex_user_to_local_dexie(
    profile: ConvexUserProfile,
  ): Promise<unknown>;
  pull_user_scoped_record_from_convex(
    table_name: string,
    record_id: string,
  ): Promise<unknown>;
  get_unsynced_local_change_count(): AsyncResult<number>;
  sign_out_and_tear_down_device(landing_path: string): AsyncResult<boolean>;
  show_session_notice(kind: SessionSyncNoticeKind): boolean;
  show_sync_retry(kind: SessionSyncRetryKind): boolean;
  dismiss_sync_retry(): boolean;
  delay(milliseconds: number): Promise<void>;
}

type LoginSyncStepResult = Result<boolean>;
