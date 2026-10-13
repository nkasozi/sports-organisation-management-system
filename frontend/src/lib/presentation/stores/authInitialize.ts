import { get } from "svelte/store";

import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import type { SavedTokenState } from "./authHelperContracts";
import {
  build_profiles_with_public_viewer,
  clear_auth_storage,
  load_saved_token,
} from "./authHelpers";
import {
  create_default_anonymous_state,
  load_available_profiles,
  wait_for_clerk,
} from "./authInitializationHelpers";
import { restore_offline_verified_session_from_device } from "./authOfflineVerifiedSessionRuntime";
import {
  initialize_public_viewer_only_session,
  PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY,
  type PublicViewerOnlySessionDependencies,
} from "./authPublicViewerOnlySession";
import {
  apply_resolved_session,
  type AuthStateSetter,
  initialize_anonymous_session,
} from "./authSessionApplication";
import { resolve_signed_in_session } from "./authSignedInSessionResolution";
import type { AuthState, UserProfile } from "./authTypes";
import {
  DEVICE_SESSION_STATUS,
  type DeviceSessionState,
} from "./deviceSessionState";
import { resolve_current_device_session } from "./initialSyncStore";

interface AuthInitializationContext {
  available_profiles: UserProfile[];
  saved_token_state: SavedTokenState;
  state_setter: AuthStateSetter;
}

const PUBLIC_VIEWER_ONLY_SESSION_DEPENDENCIES: PublicViewerOnlySessionDependencies =
  {
    clear_auth_storage,
    build_profiles_with_public_viewer,
    create_default_anonymous_state,
  };

async function initialize_signed_in_session(
  context: AuthInitializationContext,
): Promise<Result<true>> {
  const session_result = await resolve_signed_in_session(
    context.available_profiles,
    context.saved_token_state,
  );
  if (!session_result.success)
    return create_failure_result(session_result.error);
  return apply_resolved_session(
    session_result.data,
    context.available_profiles,
    context.state_setter,
  );
}

async function initialize_offline_verified_session(
  context: AuthInitializationContext,
): Promise<Result<true>> {
  const session_result = await restore_offline_verified_session_from_device({
    available_profiles: context.available_profiles,
    saved_token_state: context.saved_token_state,
  });
  if (!session_result.success)
    return initialize_public_viewer_only_session(
      PUBLIC_VIEWER_ONLY_SESSION_DEPENDENCIES,
      context.state_setter,
      PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY.KEEP_SAVED_CREDENTIALS,
    );
  return apply_resolved_session(
    session_result.data,
    [session_result.data.profile],
    context.state_setter,
  );
}

function initialize_for_device_session(
  device_session: DeviceSessionState,
  context: AuthInitializationContext,
): Promise<Result<true>> {
  switch (device_session.status) {
    case DEVICE_SESSION_STATUS.SIGNED_IN:
      return initialize_signed_in_session(context);
    case DEVICE_SESSION_STATUS.OFFLINE_VERIFIED:
      return initialize_offline_verified_session(context);
    case DEVICE_SESSION_STATUS.SESSION_ENDED:
      return initialize_public_viewer_only_session(
        PUBLIC_VIEWER_ONLY_SESSION_DEPENDENCIES,
        context.state_setter,
        PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY.CLEAR_SAVED_CREDENTIALS,
      );
    case DEVICE_SESSION_STATUS.ANONYMOUS:
      return initialize_anonymous_session(
        context.available_profiles,
        context.saved_token_state,
        context.state_setter,
      );
  }
}

export async function execute_auth_initialization(
  current_state: AuthState,
  state_setter: AuthStateSetter,
): Promise<Result<true>> {
  if (current_state.is_initialized) return create_success_result(true);
  await wait_for_clerk();
  const context: AuthInitializationContext = {
    available_profiles: await load_available_profiles(),
    saved_token_state: await load_saved_token(),
    state_setter,
  };
  if (get(is_signed_in)) return initialize_signed_in_session(context);
  return initialize_for_device_session(
    await resolve_current_device_session(),
    context,
  );
}
