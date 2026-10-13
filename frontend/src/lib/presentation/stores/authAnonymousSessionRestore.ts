import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import type { AuthToken } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  clear_auth_storage,
  load_sidebar_menu_for_role,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import {
  find_profile_by_id,
  type RestoredAnonymousSessionState,
} from "./authInitializationContracts";
import {
  build_restored_auth_token,
  verify_saved_token,
} from "./authSavedTokenVerification";
import {
  AUTH_STORE_LOG_EVENTS,
  PROFILE_MATCH_STATUS,
  SAVED_TOKEN_VERIFICATION_STATUS,
  SESSION_RESTORE_STATUS,
} from "./authStoreConstants";
import {
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";

async function build_restored_anonymous_session(
  available_profiles: UserProfile[],
  switched_profile: UserProfile,
  restored_token: AuthToken,
): Promise<RestoredAnonymousSessionState> {
  sync_user_context_with_event_bus({
    status: PRESENCE_STATUS.PRESENT,
    profile: switched_profile,
  });
  const sidebar_menu_items = await load_sidebar_menu_for_role(
    switched_profile.role,
  );
  await sync_branding_with_profile({
    status: PRESENCE_STATUS.PRESENT,
    profile: switched_profile,
  });
  console.log("[AuthStore] Restored switched profile from saved token", {
    event: AUTH_STORE_LOG_EVENTS.SWITCHED_PROFILE_RESTORED,
    profile_id: switched_profile.id,
    role: switched_profile.role,
  });
  return {
    status: SESSION_RESTORE_STATUS.RESTORED,
    auth_state: {
      current_token: create_present_auth_token_state(restored_token),
      current_profile: create_present_auth_profile_state(switched_profile),
      available_profiles,
      sidebar_menu_items,
      is_initialized: true,
      is_demo_session: true,
    },
  };
}

export async function try_restore_anonymous_session(
  available_profiles: UserProfile[],
  saved_token_raw: string,
): Promise<RestoredAnonymousSessionState> {
  const verification_state = await verify_saved_token(saved_token_raw);
  if (verification_state.status !== SAVED_TOKEN_VERIFICATION_STATUS.VERIFIED) {
    console.warn(
      "[AuthStore] Saved token invalid or profile missing — clearing and defaulting to public viewer",
      { event: AUTH_STORE_LOG_EVENTS.SAVED_TOKEN_INVALID_ON_ANONYMOUS_RESTORE },
    );
    await clear_auth_storage();
    return { status: SESSION_RESTORE_STATUS.NOT_RESTORED };
  }
  const switched_profile_state = find_profile_by_id(
    available_profiles,
    verification_state.payload.user_id,
  );

  if (switched_profile_state.status !== PROFILE_MATCH_STATUS.FOUND) {
    console.warn("[AuthStore] Saved token profile no longer exists", {
      event:
        AUTH_STORE_LOG_EVENTS.SAVED_TOKEN_PROFILE_MISSING_ON_ANONYMOUS_RESTORE,
      profile_id: verification_state.payload.user_id,
    });
    await clear_auth_storage();
    return { status: SESSION_RESTORE_STATUS.NOT_RESTORED };
  }

  return build_restored_anonymous_session(
    available_profiles,
    switched_profile_state.profile,
    build_restored_auth_token(verification_state.payload, saved_token_raw),
  );
}
