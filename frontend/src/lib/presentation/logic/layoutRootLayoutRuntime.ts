import { get } from "svelte/store";

import { goto } from "$app/navigation";
import { clerk_session, sign_out } from "$lib/adapters/iam/clerkAuthService";
import { reset_all_data } from "$lib/adapters/initialization/dataResetService";
import { reset_database } from "$lib/adapters/repositories/database";
import { get_storage_backup_coordinator } from "$lib/infrastructure/backup/storageBackupRuntime";
import {
  flush_pending_changes,
  get_unsynced_local_change_count,
  set_pulling_from_remote,
  start_background_sync,
  trigger_full_sync_on_page_reload,
} from "$lib/infrastructure/sync/backgroundSyncService";
import {
  pull_user_scoped_record_from_convex,
  reset_sync_metadata,
  write_convex_user_to_local_dexie,
} from "$lib/infrastructure/sync/convexSyncService";
import {
  start_background_sync_and_resume,
  stop_background_sync_and_wait_for_idle,
} from "$lib/infrastructure/sync/syncSessionQuiesce";
import { build_active_clerk_identity_state } from "$lib/presentation/stores/activeClerkIdentity";
import {
  auth_store,
  fetch_current_user_profile_from_convex,
} from "$lib/presentation/stores/auth";
import { branding_store } from "$lib/presentation/stores/branding";
import { current_user_store } from "$lib/presentation/stores/currentUser";
import { initial_sync_store } from "$lib/presentation/stores/initialSyncStore";
import { public_organization_store } from "$lib/presentation/stores/publicOrganization";
import { read_session_sync_state_from_storage } from "$lib/presentation/stores/sessionSyncMarker";
import { session_sync_notice_store } from "$lib/presentation/stores/sessionSyncNotice";
import { sync_store } from "$lib/presentation/stores/syncStore";
import { initialize_theme } from "$lib/presentation/stores/theme";

import {
  type LayoutLoginSyncDependencies,
  sync_verified_user_login_session,
} from "./layoutLoginSync";
import type { RootLayoutSessionHandlers } from "./layoutRootLayoutStartup";
import { create_layout_login_sync_dependencies } from "./layoutSessionFlowDependencies";
import {
  handle_first_time_anonymous_user_session,
  handle_returning_anonymous_user_session,
  handle_verified_user_page_reload_session,
} from "./layoutSessionFlows";
import { handle_root_layout_session_ended } from "./layoutSessionTransitionRuntime";
import type { StartupStorageRecoveryFlowDependencies } from "./layoutStartupStorageRecoveryFlow";
import { sign_out_and_tear_down_device } from "./logoutDeviceTeardownRuntime";

type StartupStorageRecoveryUiCallbacks = Pick<
  StartupStorageRecoveryFlowDependencies,
  "wait_for_choice" | "show_restore_progress" | "hide_restore_progress"
>;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function create_root_layout_login_sync_dependencies(
  confirm_discard_unsynced_local_changes: LayoutLoginSyncDependencies["confirm_discard_unsynced_local_changes"],
): LayoutLoginSyncDependencies {
  return create_layout_login_sync_dependencies({
    initial_sync_store,
    get_initial_sync_state: () => get(initial_sync_store),
    auth_store,
    sync_store,
    stop_background_sync: stop_background_sync_and_wait_for_idle,
    start_background_sync: start_background_sync_and_resume,
    reset_database,
    reset_sync_metadata,
    fetch_current_user_profile_from_convex,
    set_pulling_from_remote,
    write_convex_user_to_local_dexie,
    pull_user_scoped_record_from_convex,
    sign_out,
    sign_out_and_tear_down_device,
    show_session_notice: session_sync_notice_store.show,
    goto,
    delay,
    get_unsynced_local_change_count,
    confirm_discard_unsynced_local_changes,
    read_session_sync_state: read_session_sync_state_from_storage,
    get_active_clerk_identity: () =>
      build_active_clerk_identity_state(get(clerk_session)),
    flush_pending_changes,
  });
}

export function create_root_layout_startup_storage_recovery_dependencies(
  ui_callbacks: StartupStorageRecoveryUiCallbacks,
): StartupStorageRecoveryFlowDependencies {
  const storage_backup_coordinator = get_storage_backup_coordinator();
  return {
    evaluate_startup_recovery: () =>
      storage_backup_coordinator.evaluate_startup_recovery(),
    restore_from_device_backup: () =>
      storage_backup_coordinator.restore_from_device_backup(),
    ...ui_callbacks,
  };
}

export function create_root_layout_session_handlers(
  login_sync_dependencies: LayoutLoginSyncDependencies,
): RootLayoutSessionHandlers {
  return {
    login_sync: () => sync_verified_user_login_session(login_sync_dependencies),
    verified_page_reload: () =>
      handle_verified_user_page_reload_session({
        auth_store,
        start_background_sync,
        trigger_full_sync_on_page_reload,
      }),
    first_time_anonymous: () =>
      handle_first_time_anonymous_user_session({
        initial_sync_store,
        reset_all_data,
        auth_store,
        start_background_sync,
        get_unsynced_local_change_count,
        show_session_notice: session_sync_notice_store.show,
      }),
    returning_anonymous: () =>
      handle_returning_anonymous_user_session({
        auth_store,
        start_background_sync,
      }),
    session_ended: handle_root_layout_session_ended,
  };
}

export async function initialize_root_layout_stores(): Promise<boolean> {
  await initialize_theme();
  await branding_store.initialize();
  await public_organization_store.initialize();
  await current_user_store.initialize();
  return true;
}
