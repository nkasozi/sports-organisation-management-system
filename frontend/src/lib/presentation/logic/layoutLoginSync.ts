import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { SyncResult } from "$lib/infrastructure/sync/syncTypes";

import {
  build_sync_progress_message,
  scale_sync_percentage,
  should_pull_org_from_server,
} from "./layoutLogic";

const LOGIN_SYNC_FAILED_EVENT = "login_sync_failed";
const LOGIN_SYNC_FAILED_REDIRECT = "/sign-in?error=sync_failed";
const UNAUTHORIZED_REDIRECT = "/unauthorized";
const NO_PROFILE_FOUND_ERROR = "No profile found for this account.";

export interface InitialSyncStateSnapshot {
  is_syncing: boolean;
}

export interface ConvexProfileData {
  organization_id?: string | null;
  team_id?: string | null;
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

interface SyncStoreProgress {
  table_name: string;
  tables_completed: number;
  total_tables: number;
  percentage: number;
}

export interface SyncStorePort {
  subscribe(
    handler: (state: { current_progress: SyncStoreProgress | null }) => void,
  ): () => void;
  sync_now(direction: "pull"): Promise<SyncResult>;
}

export interface LayoutLoginSyncDependencies {
  initial_sync_store: InitialSyncStorePort;
  auth_store: AuthStorePort;
  sync_store: SyncStorePort;
  stop_background_sync(): void;
  start_background_sync(): void;
  reset_database(): Promise<unknown>;
  reset_sync_metadata(): Promise<unknown>;
  fetch_current_user_profile_from_convex(): Promise<{
    success: boolean;
    data?: ConvexProfileData | null;
    error?: string;
  }>;
  set_pulling_from_remote(value: boolean): void;
  write_convex_user_to_local_dexie(
    profile: ConvexProfileData,
  ): Promise<unknown>;
  pull_user_scoped_record_from_convex(
    table_name: string,
    record_id: string,
  ): Promise<unknown>;
  clear_session_sync_flag(): Promise<unknown>;
  sign_out(): Promise<unknown>;
  goto(path: string): Promise<void>;
  delay(milliseconds: number): Promise<void>;
}

async function cleanup_failed_login_sync(
  dependencies: LayoutLoginSyncDependencies,
  error_message: string,
  unsubscribe_sync_progress: (() => void) | null,
): Promise<Result<boolean>> {
  console.error("[Layout] Login sync failed", {
    event: LOGIN_SYNC_FAILED_EVENT,
    error: error_message,
  });
  unsubscribe_sync_progress?.();
  dependencies.initial_sync_store.reset();
  await dependencies.clear_session_sync_flag();
  await dependencies.sign_out();
  await dependencies.goto(LOGIN_SYNC_FAILED_REDIRECT);
  return create_failure_result(error_message);
}

export async function sync_verified_user_login_session(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<boolean>> {
  if (dependencies.initial_sync_store.get_state().is_syncing) {
    console.log(
      "[Layout] Sync already in progress, skipping duplicate request",
      {
        event: "sync_duplicate_skipped",
      },
    );
    return create_success_result(false);
  }
  dependencies.initial_sync_store.start_sync();
  let unsubscribe_sync_progress: (() => void) | null = null;
  dependencies.initial_sync_store.update_progress(
    "Stopping background processes...",
    5,
  );
  dependencies.stop_background_sync();
  dependencies.initial_sync_store.update_progress(
    "Looking up your profile...",
    8,
  );
  const profile_result =
    await dependencies.fetch_current_user_profile_from_convex();
  if (!profile_result.success || !profile_result.data) {
    console.warn("[Layout] No Convex profile found for signed-in user", {
      event: "login_profile_not_found",
      error: !profile_result.success ? profile_result.error : "no_profile_data",
    });
    dependencies.initial_sync_store.reset();
    await dependencies.clear_session_sync_flag();
    await dependencies.sign_out();
    await dependencies.goto(UNAUTHORIZED_REDIRECT);
    return create_failure_result(NO_PROFILE_FOUND_ERROR);
  }
  dependencies.initial_sync_store.update_progress(
    "Profile found. Preparing your workspace...",
    9,
  );
  dependencies.set_pulling_from_remote(true);
  dependencies.initial_sync_store.update_progress("Clearing local data...", 10);
  await dependencies.reset_database();
  await dependencies.reset_sync_metadata();
  dependencies.initial_sync_store.update_progress(
    "Setting up your account...",
    17,
  );
  await dependencies.write_convex_user_to_local_dexie(profile_result.data);
  if (should_pull_org_from_server(profile_result.data.organization_id)) {
    dependencies.initial_sync_store.update_progress(
      "Loading your organisation...",
      18,
    );
    await dependencies.pull_user_scoped_record_from_convex(
      "organizations",
      profile_result.data.organization_id!,
    );
  }
  if (profile_result.data.team_id) {
    dependencies.initial_sync_store.update_progress("Loading your team...", 19);
    await dependencies.pull_user_scoped_record_from_convex(
      "teams",
      profile_result.data.team_id,
    );
  }
  dependencies.initial_sync_store.update_progress("Starting data sync...", 20);
  dependencies.set_pulling_from_remote(false);
  unsubscribe_sync_progress = dependencies.sync_store.subscribe((state) => {
    if (!state.current_progress) return;
    dependencies.initial_sync_store.update_progress(
      build_sync_progress_message(
        state.current_progress.table_name,
        state.current_progress.tables_completed,
        state.current_progress.total_tables,
      ),
      scale_sync_percentage(state.current_progress.percentage),
    );
  });
  const first_sync_result = await dependencies.sync_store.sync_now("pull");
  if (!first_sync_result.success && first_sync_result.errors.length > 0) {
    return cleanup_failed_login_sync(
      dependencies,
      `Sync failed: ${first_sync_result.errors[0]?.error || "Unknown sync error"}`,
      unsubscribe_sync_progress,
    );
  }
  unsubscribe_sync_progress?.();
  dependencies.initial_sync_store.update_progress(
    "Resolving references...",
    88,
  );
  await dependencies.sync_store.sync_now("pull");
  dependencies.initial_sync_store.update_progress("Almost ready...", 92);
  dependencies.start_background_sync();
  await dependencies.delay(400);
  dependencies.initial_sync_store.update_progress(
    "Loading your profile...",
    96,
  );
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  await dependencies.initial_sync_store.complete_sync();
  await dependencies.delay(500);
  console.log("[Layout] Verified user login sync complete", {
    event: "verified_user_login_sync_complete",
  });
  return create_success_result(true);
}
