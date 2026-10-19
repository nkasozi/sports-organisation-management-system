import type { Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { SESSION_SYNC_RETRY_KIND } from "$lib/presentation/stores/sessionSyncRetryNotice";

import {
  log_discarded_pending_changes,
  stop_login_sync_for_retry,
} from "./layoutLoginSyncFailure";
import type { LayoutLoginSyncDependencies } from "./layoutLoginSyncPorts";
import {
  clear_sync_progress_subscription,
  create_inactive_sync_progress_subscription,
  subscribe_to_login_sync_progress,
} from "./layoutLoginSyncProgress";
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
  run_with_timeout,
  SESSION_OPERATION_TIMEOUT_MS,
  TIMED_OPERATION_STATUS,
} from "./layoutSessionTimeouts";

export type {
  AuthStorePort,
  LayoutLoginSyncDependencies,
} from "./layoutLoginSyncPorts";

const PULL_DIRECTION = "pull";
const FINALIZE_DELAY_MS = 400;
const COMPLETE_DELAY_MS = 500;

async function pull_first_pass(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<boolean>> {
  const outcome = await run_with_timeout(
    dependencies.sync_store.sync_now(PULL_DIRECTION),
    SESSION_OPERATION_TIMEOUT_MS.ACCOUNT_PULL,
  );
  switch (outcome.status) {
    case TIMED_OPERATION_STATUS.TIMED_OUT:
      return { success: false, error: LAYOUT_SESSION_MESSAGE.PULL_TIMED_OUT };
    case TIMED_OPERATION_STATUS.FAILED:
      return { success: false, error: outcome.error };
    case TIMED_OPERATION_STATUS.COMPLETED:
      return outcome.value.success || outcome.value.errors.length === 0
        ? create_success_result(true)
        : {
            success: false,
            error: `${LAYOUT_SESSION_MESSAGE.SYNC_FAILED_PREFIX} ${outcome.value.errors[0]?.error || LAYOUT_SESSION_MESSAGE.UNKNOWN_SYNC_ERROR}`,
          };
  }
}

async function pull_account_data(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<boolean>> {
  const sync_progress_subscription =
    subscribe_to_login_sync_progress(dependencies);
  const first_pull = await pull_first_pass(dependencies);
  if (!first_pull.success)
    return stop_login_sync_for_retry(
      dependencies,
      SESSION_SYNC_RETRY_KIND.ACCOUNT_DATA_UNAVAILABLE,
      first_pull.error,
      sync_progress_subscription,
    );
  clear_sync_progress_subscription(sync_progress_subscription);
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.RESOLVING_REFERENCES.message,
    LAYOUT_SESSION_PROGRESS.RESOLVING_REFERENCES.percentage,
  );
  await run_with_timeout(
    dependencies.sync_store.sync_now(PULL_DIRECTION),
    SESSION_OPERATION_TIMEOUT_MS.ACCOUNT_PULL,
  );
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
  dependencies.start_realtime_sync();
  await dependencies.delay(FINALIZE_DELAY_MS);
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.LOADING_PROFILE.message,
    LAYOUT_SESSION_PROGRESS.LOADING_PROFILE.percentage,
  );
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  const completion = await dependencies.initial_sync_store.complete_sync();
  if (!completion.success)
    return stop_login_sync_for_retry(
      dependencies,
      SESSION_SYNC_RETRY_KIND.SESSION_NOT_SAVED,
      completion.error,
      create_inactive_sync_progress_subscription(),
    );
  await dependencies.delay(COMPLETE_DELAY_MS);
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
  dependencies.dismiss_sync_retry();
  await log_discarded_pending_changes(dependencies);
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.STOPPING_BACKGROUND.message,
    LAYOUT_SESSION_PROGRESS.STOPPING_BACKGROUND.percentage,
  );
  await dependencies.stop_background_sync();
  const profile_result = await look_up_login_sync_profile(dependencies);
  if (!profile_result.success) return profile_result;
  const workspace_result = await prepare_login_sync_workspace(
    dependencies,
    profile_result.data,
  );
  if (!workspace_result.success) return workspace_result;
  const pull_result = await pull_account_data(dependencies);
  if (!pull_result.success) return pull_result;
  return finalize_login_sync(dependencies);
}
