import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { SyncResult } from "$lib/infrastructure/sync/syncTypes";
import type { ConvexUserProfile } from "$lib/presentation/stores/authTypes";
import type { SyncProgressState } from "$lib/presentation/stores/syncStoreTypes";

import {
  build_sync_progress_message,
  scale_sync_percentage,
  should_pull_org_from_server,
} from "./layoutLogic";

const LOGIN_SYNC_FAILED_EVENT = "login_sync_failed";
const LOGIN_SYNC_FAILED_REDIRECT = "/sign-in?error=sync_failed";
const UNAUTHORIZED_REDIRECT = "/unauthorized";
const NO_PROFILE_FOUND_ERROR = "No profile found for this account.";

interface InitialSyncStateSnapshot {
  is_syncing: boolean;
}

type ProfileIdentifierState =
  | { status: "absent" }
  | { status: "present"; value: string };

type SyncProgressSubscriptionState =
  | { status: "inactive" }
  | { status: "active"; unsubscribe: () => void };

interface LoginSyncProfile {
  profile: ConvexUserProfile;
  organization_id: ProfileIdentifierState;
  team_id: ProfileIdentifierState;
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
    handler: (state: { current_progress: SyncProgressState }) => void,
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
  fetch_current_user_profile_from_convex(): Promise<Result<ConvexUserProfile>>;
  set_pulling_from_remote(value: boolean): void;
  write_convex_user_to_local_dexie(
    profile: ConvexUserProfile,
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

function create_absent_profile_identifier_state(): ProfileIdentifierState {
  return { status: "absent" };
}

function create_present_profile_identifier_state(
  value: string,
): ProfileIdentifierState {
  return { status: "present", value };
}

function create_profile_identifier_state(
  value: string | undefined,
): ProfileIdentifierState {
  if (!value) {
    return create_absent_profile_identifier_state();
  }

  return create_present_profile_identifier_state(value);
}

function normalize_login_sync_profile(
  profile: ConvexUserProfile,
): LoginSyncProfile {
  return {
    profile,
    organization_id: create_profile_identifier_state(profile.organization_id),
    team_id: create_profile_identifier_state(profile.team_id),
  };
}

function create_inactive_sync_progress_subscription_state(): SyncProgressSubscriptionState {
  return { status: "inactive" };
}

function create_active_sync_progress_subscription_state(
  unsubscribe: () => void,
): SyncProgressSubscriptionState {
  return { status: "active", unsubscribe };
}

function clear_sync_progress_subscription(
  sync_progress_subscription: SyncProgressSubscriptionState,
): void {
  if (sync_progress_subscription.status !== "active") {
    return;
  }

  sync_progress_subscription.unsubscribe();
}

async function cleanup_failed_login_sync(
  dependencies: LayoutLoginSyncDependencies,
  error_message: string,
  sync_progress_subscription: SyncProgressSubscriptionState,
): Promise<Result<boolean>> {
  console.error("[Layout] Login sync failed", {
    event: LOGIN_SYNC_FAILED_EVENT,
    error: error_message,
  });
  clear_sync_progress_subscription(sync_progress_subscription);
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
  let sync_progress_subscription =
    create_inactive_sync_progress_subscription_state();
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
  if (!profile_result.success) {
    console.warn("[Layout] No Convex profile found for signed-in user", {
      event: "login_profile_not_found",
      error: profile_result.error,
    });
    dependencies.initial_sync_store.reset();
    await dependencies.clear_session_sync_flag();
    await dependencies.sign_out();
    await dependencies.goto(UNAUTHORIZED_REDIRECT);
    return create_failure_result(NO_PROFILE_FOUND_ERROR);
  }
  const login_sync_profile = normalize_login_sync_profile(profile_result.data);
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
  await dependencies.write_convex_user_to_local_dexie(
    login_sync_profile.profile,
  );
  if (
    login_sync_profile.organization_id.status === "present" &&
    should_pull_org_from_server(login_sync_profile.organization_id.value)
  ) {
    dependencies.initial_sync_store.update_progress(
      "Loading your organisation...",
      18,
    );
    await dependencies.pull_user_scoped_record_from_convex(
      "organizations",
      login_sync_profile.organization_id.value,
    );
  }
  if (login_sync_profile.team_id.status === "present") {
    dependencies.initial_sync_store.update_progress("Loading your team...", 19);
    await dependencies.pull_user_scoped_record_from_convex(
      "teams",
      login_sync_profile.team_id.value,
    );
  }
  dependencies.initial_sync_store.update_progress("Starting data sync...", 20);
  dependencies.set_pulling_from_remote(false);
  sync_progress_subscription = create_active_sync_progress_subscription_state(
    dependencies.sync_store.subscribe((state) => {
      if (state.current_progress.status !== "active") return;
      dependencies.initial_sync_store.update_progress(
        build_sync_progress_message(
          state.current_progress.progress.table_name,
          state.current_progress.progress.tables_completed,
          state.current_progress.progress.total_tables,
        ),
        scale_sync_percentage(state.current_progress.progress.percentage),
      );
    }),
  );
  const first_sync_result = await dependencies.sync_store.sync_now("pull");
  if (!first_sync_result.success && first_sync_result.errors.length > 0) {
    return cleanup_failed_login_sync(
      dependencies,
      `Sync failed: ${first_sync_result.errors[0]?.error || "Unknown sync error"}`,
      sync_progress_subscription,
    );
  }
  clear_sync_progress_subscription(sync_progress_subscription);
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
