import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  abort_login_to_protect_local_changes,
  allows_login_data_wipe,
  evaluate_login_local_change_guard,
} from "./layoutLoginLocalChangeGuard";
import type { LayoutLoginSyncDependencies } from "./layoutLoginSyncPorts";
import {
  clear_sync_progress_subscription,
  subscribe_to_login_sync_progress,
  type SyncProgressSubscriptionState,
} from "./layoutLoginSyncProgress";
import { sign_out_after_failed_login } from "./layoutLoginSyncSignOut";
import {
  look_up_login_sync_profile,
  prepare_login_sync_workspace,
} from "./layoutLoginSyncWorkspace";
import {
  LAYOUT_SESSION_EVENT,
  LAYOUT_SESSION_MESSAGE,
  LAYOUT_SESSION_PROGRESS,
} from "./layoutSessionConstants";
import {
  build_sign_in_error_path,
  SIGN_IN_ERROR_CODE,
} from "./signInPageState";

export type {
  AuthStorePort,
  LayoutLoginSyncDependencies,
} from "./layoutLoginSyncPorts";

const PULL_DIRECTION = "pull";

async function cleanup_failed_login_sync(
  dependencies: LayoutLoginSyncDependencies,
  error_message: string,
  sync_progress_subscription: SyncProgressSubscriptionState,
): Promise<Result<boolean>> {
  console.error("[Layout] Login sync failed", {
    event: LAYOUT_SESSION_EVENT.LOGIN_SYNC_FAILED,
    error: error_message,
  });
  clear_sync_progress_subscription(sync_progress_subscription);
  dependencies.initial_sync_store.reset();
  await sign_out_after_failed_login(
    dependencies,
    build_sign_in_error_path(SIGN_IN_ERROR_CODE.SYNC_FAILED),
  );
  return create_failure_result(error_message);
}

async function pull_account_data(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<boolean>> {
  const sync_progress_subscription =
    subscribe_to_login_sync_progress(dependencies);
  const first_sync_result =
    await dependencies.sync_store.sync_now(PULL_DIRECTION);
  if (!first_sync_result.success && first_sync_result.errors.length > 0)
    return cleanup_failed_login_sync(
      dependencies,
      `${LAYOUT_SESSION_MESSAGE.SYNC_FAILED_PREFIX} ${first_sync_result.errors[0]?.error || LAYOUT_SESSION_MESSAGE.UNKNOWN_SYNC_ERROR}`,
      sync_progress_subscription,
    );
  clear_sync_progress_subscription(sync_progress_subscription);
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.RESOLVING_REFERENCES.message,
    LAYOUT_SESSION_PROGRESS.RESOLVING_REFERENCES.percentage,
  );
  await dependencies.sync_store.sync_now(PULL_DIRECTION);
  return create_success_result(true);
}

async function finalize_login_sync(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<boolean>> {
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.ALMOST_READY.message,
    LAYOUT_SESSION_PROGRESS.ALMOST_READY.percentage,
  );
  dependencies.start_background_sync();
  await dependencies.delay(400);
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.LOADING_PROFILE.message,
    LAYOUT_SESSION_PROGRESS.LOADING_PROFILE.percentage,
  );
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  await dependencies.initial_sync_store.complete_sync();
  await dependencies.delay(500);
  console.log("[Layout] Verified user login sync complete", {
    event: LAYOUT_SESSION_EVENT.LOGIN_SYNC_COMPLETE,
  });
  return create_success_result(true);
}

function is_login_sync_already_running(
  dependencies: LayoutLoginSyncDependencies,
): boolean {
  if (!dependencies.initial_sync_store.get_state().is_syncing) return false;
  console.log("[Layout] Sync already in progress, skipping duplicate request", {
    event: LAYOUT_SESSION_EVENT.LOGIN_SYNC_DUPLICATE_SKIPPED,
  });
  return true;
}

export async function sync_verified_user_login_session(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<boolean>> {
  if (is_login_sync_already_running(dependencies))
    return create_success_result(false);
  dependencies.initial_sync_store.start_sync();
  const local_change_guard =
    await evaluate_login_local_change_guard(dependencies);
  if (!allows_login_data_wipe(local_change_guard))
    return abort_login_to_protect_local_changes(
      dependencies,
      local_change_guard,
    );
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.STOPPING_BACKGROUND.message,
    LAYOUT_SESSION_PROGRESS.STOPPING_BACKGROUND.percentage,
  );
  await dependencies.stop_background_sync();
  const profile_result = await look_up_login_sync_profile(dependencies);
  if (!profile_result.success) return profile_result;
  await prepare_login_sync_workspace(dependencies, profile_result.data);
  const pull_result = await pull_account_data(dependencies);
  if (!pull_result.success) return pull_result;
  return finalize_login_sync(dependencies);
}
