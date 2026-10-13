import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import type { Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { SavedTokenState } from "./authHelperContracts";
import {
  load_sidebar_menu_for_role,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import {
  create_default_anonymous_state,
  try_restore_anonymous_session,
} from "./authInitializationHelpers";
import type { ResolvedAuthSession } from "./authSignedInSessionResolution";
import { SESSION_RESTORE_STATUS } from "./authStoreConstants";
import {
  type AuthState,
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";

export type AuthStateSetter = (state: AuthState) => void;

export async function initialize_anonymous_session(
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

export async function apply_resolved_session(
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
