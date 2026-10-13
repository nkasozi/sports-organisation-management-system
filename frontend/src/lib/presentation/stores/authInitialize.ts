import { get } from "svelte/store";

import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { SavedTokenState } from "./authHelperContracts";
import {
  load_saved_token,
  load_sidebar_menu_for_role,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import {
  create_default_anonymous_state,
  load_available_profiles,
  try_restore_anonymous_session,
  wait_for_clerk,
} from "./authInitializationHelpers";
import {
  resolve_signed_in_session,
  type ResolvedAuthSession,
} from "./authSignedInSessionResolution";
import { SESSION_RESTORE_STATUS } from "./authStoreConstants";
import {
  type AuthState,
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";

type AuthStateSetter = (state: AuthState) => void;

async function initialize_anonymous_session(
  available_profiles: UserProfile[],
  saved_token_state: SavedTokenState,
  state_setter: AuthStateSetter,
): Promise<Result<true>> {
  const restored =
    saved_token_state.status === PRESENCE_STATUS.PRESENT
      ? await try_restore_anonymous_session(
          available_profiles,
          saved_token_state.raw_token,
        )
      : { status: SESSION_RESTORE_STATUS.NOT_RESTORED };
  if (restored.status === SESSION_RESTORE_STATUS.RESTORED) {
    state_setter(restored.auth_state);
    return create_success_result(true);
  }
  state_setter(await create_default_anonymous_state(available_profiles));
  return create_success_result(true);
}

async function apply_resolved_session(
  session: ResolvedAuthSession,
  available_profiles: UserProfile[],
  state_setter: AuthStateSetter,
): Promise<Result<true>> {
  const current_profile = session.profile;
  sync_user_context_with_event_bus({
    status: PRESENCE_STATUS.PRESENT,
    profile: current_profile,
  });
  const sidebar_menu_items = await load_sidebar_menu_for_role(
    current_profile.role,
  );

  state_setter({
    current_token: create_present_auth_token_state(session.token),
    current_profile: create_present_auth_profile_state(current_profile),
    available_profiles,
    sidebar_menu_items,
    is_initialized: true,
    is_demo_session: false,
  });

  await sync_branding_with_profile({
    status: PRESENCE_STATUS.PRESENT,
    profile: current_profile,
  });
  return create_success_result(true);
}

export async function execute_auth_initialization(
  current_state: AuthState,
  state_setter: (state: AuthState) => void,
): Promise<Result<true>> {
  if (current_state.is_initialized) return create_success_result(true);

  await wait_for_clerk();
  const available_profiles = await load_available_profiles();
  const saved_token_state = await load_saved_token();
  const user_is_signed_in = get(is_signed_in);

  if (!user_is_signed_in) {
    return initialize_anonymous_session(
      available_profiles,
      saved_token_state,
      state_setter,
    );
  }

  const session_result = await resolve_signed_in_session(
    available_profiles,
    saved_token_state,
  );
  if (!session_result.success) {
    return create_failure_result(session_result.error);
  }

  return apply_resolved_session(
    session_result.data,
    available_profiles,
    state_setter,
  );
}
