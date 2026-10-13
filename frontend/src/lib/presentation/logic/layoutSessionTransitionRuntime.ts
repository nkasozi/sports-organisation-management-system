import { sign_out } from "$lib/adapters/iam/clerkAuthService";
import {
  get_unsynced_local_change_count,
  start_background_sync,
  trigger_full_sync_on_page_reload,
} from "$lib/infrastructure/sync/backgroundSyncService";
import { auth_store } from "$lib/presentation/stores/auth";
import {
  has_session_been_synced,
  resolve_current_device_session,
} from "$lib/presentation/stores/initialSyncStore";
import {
  clear_pending_clerk_sign_out,
  has_pending_clerk_sign_out,
} from "$lib/presentation/stores/pendingClerkSignOut";
import { session_ended_notice_store } from "$lib/presentation/stores/sessionEndedNotice";
import { session_sync_notice_store } from "$lib/presentation/stores/sessionSyncNotice";

import {
  type LayoutLoginSyncDependencies,
  sync_verified_user_login_session,
} from "./layoutLoginSync";
import {
  handle_device_session_after_sign_out,
  handle_ended_verified_session,
  type SessionEndedPolicyDependencies,
} from "./layoutSessionEndedPolicy";
import {
  handle_returning_anonymous_user_session,
  handle_verified_user_page_reload_session,
} from "./layoutSessionFlows";
import { handle_user_signed_in_transition } from "./layoutSignedInTransition";
import { sign_out_and_tear_down_device } from "./logoutDeviceTeardownRuntime";
import {
  complete_pending_clerk_sign_out,
  type PendingClerkSignOutOutcome,
} from "./pendingClerkSignOutCompletion";

export function complete_root_layout_pending_clerk_sign_out(): Promise<PendingClerkSignOutOutcome> {
  return complete_pending_clerk_sign_out({
    has_pending_clerk_sign_out,
    sign_out,
    clear_pending_clerk_sign_out,
  });
}

function create_session_ended_policy_dependencies(): SessionEndedPolicyDependencies {
  return {
    resolve_current_device_session,
    get_unsynced_local_change_count,
    sign_out_and_tear_down_device,
    lock_to_public_viewer: () =>
      handle_returning_anonymous_user_session({
        auth_store,
        start_background_sync,
      }),
    show_session_ended_notice: session_ended_notice_store.show,
    show_session_notice: session_sync_notice_store.show,
  };
}

export function handle_root_layout_session_ended(): Promise<unknown> {
  return handle_ended_verified_session(
    create_session_ended_policy_dependencies(),
  );
}

export function handle_root_layout_user_signed_out(): Promise<unknown> {
  return handle_device_session_after_sign_out(
    create_session_ended_policy_dependencies(),
  );
}

export function handle_root_layout_user_signed_in(
  login_sync_dependencies: LayoutLoginSyncDependencies,
): Promise<unknown> {
  session_ended_notice_store.dismiss();
  return handle_user_signed_in_transition({
    complete_pending_clerk_sign_out:
      complete_root_layout_pending_clerk_sign_out,
    has_session_been_synced,
    resume_verified_session: () =>
      handle_verified_user_page_reload_session({
        auth_store,
        start_background_sync,
        trigger_full_sync_on_page_reload,
      }),
    run_login_sync: () =>
      sync_verified_user_login_session(login_sync_dependencies),
  });
}
