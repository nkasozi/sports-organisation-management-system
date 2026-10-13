import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import { get_organization_repository } from "$lib/adapters/repositories/InBrowserOrganizationRepository";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { get_team_repository } from "$lib/adapters/repositories/InBrowserTeamRepository";
import type { AuthToken } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  build_profiles_with_public_viewer,
  clear_auth_storage,
  generate_token_for_profile,
  load_sidebar_menu_for_role,
  save_profile_id,
  save_token,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import {
  AUTH_STORE_LOG_EVENTS,
  EVENT_BUS_USER_CONTEXT_STATUS,
} from "./authStoreConstants";
import {
  type AuthProfileState,
  type AuthState,
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";
import { load_profiles_from_repository } from "./profileLoader";

export interface AuthStoreContext {
  read_state: () => AuthState;
  set: (state: AuthState) => void;
  update: (updater: (state: AuthState) => AuthState) => void;
}

export function build_initial_auth_state(): AuthState {
  return {
    current_token: create_missing_auth_token_state(),
    current_profile: create_missing_auth_profile_state(),
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
  };
}

function build_refreshed_current_profile_state(
  current_profile_state: AuthProfileState,
  refreshed_profiles: UserProfile[],
): AuthProfileState {
  if (current_profile_state.status !== PRESENCE_STATUS.PRESENT) {
    return current_profile_state;
  }

  const refreshed_profile = refreshed_profiles.find(
    (profile) => profile.id === current_profile_state.profile.id,
  );

  if (!refreshed_profile) {
    return current_profile_state;
  }

  return create_present_auth_profile_state(refreshed_profile);
}

export async function refresh_auth_profiles(
  context: AuthStoreContext,
): Promise<boolean> {
  console.debug("[AuthStore] Starting profile refresh", {
    event: AUTH_STORE_LOG_EVENTS.PROFILE_REFRESH_STARTED,
  });
  const repository = get_system_user_repository();
  const organization_repository = get_organization_repository();
  const loaded_profiles = await load_profiles_from_repository(
    repository,
    organization_repository,
    get_team_repository(),
  );
  const refreshed_profiles = build_profiles_with_public_viewer(loaded_profiles);

  const state = context.read_state();
  const previous_count = state.available_profiles.length;
  const refreshed_current_profile_state = build_refreshed_current_profile_state(
    state.current_profile,
    refreshed_profiles,
  );

  context.update((s) => ({
    ...s,
    available_profiles: refreshed_profiles,
    current_profile: refreshed_current_profile_state,
  }));

  console.debug("[AuthStore] Refreshed profiles", {
    event: AUTH_STORE_LOG_EVENTS.PROFILES_REFRESHED,
    previous_count,
    refreshed_count: refreshed_profiles.length,
  });
  return true;
}

async function activate_switched_profile(
  context: AuthStoreContext,
  target_profile: UserProfile,
  new_token: AuthToken,
): Promise<boolean> {
  await save_token(new_token.raw_token);
  await save_profile_id(target_profile.id);
  sync_user_context_with_event_bus({
    status: PRESENCE_STATUS.PRESENT,
    profile: target_profile,
  });
  const sidebar = await load_sidebar_menu_for_role(target_profile.role);

  context.update((s) => ({
    ...s,
    current_token: create_present_auth_token_state(new_token),
    current_profile: create_present_auth_profile_state(target_profile),
    sidebar_menu_items: sidebar,
  }));
  await sync_branding_with_profile({
    status: PRESENCE_STATUS.PRESENT,
    profile: target_profile,
  });
  console.log("[AuthStore] Switched profile", {
    event: AUTH_STORE_LOG_EVENTS.PROFILE_SWITCHED,
    profile_id: target_profile.id,
    role: target_profile.role,
  });
  return true;
}

export async function switch_auth_profile(
  context: AuthStoreContext,
  profile_id: AuthState["available_profiles"][number]["id"],
): Promise<boolean> {
  const target_profile = context
    .read_state()
    .available_profiles.find((p) => p.id === profile_id);

  if (!target_profile) {
    console.error("[AuthStore] Profile to switch to was not found", {
      event: AUTH_STORE_LOG_EVENTS.PROFILE_SWITCH_TARGET_MISSING,
      profile_id,
    });
    return false;
  }

  const token_result = await generate_token_for_profile(target_profile);
  if (!token_result.success) {
    console.error("[AuthStore] Failed to switch profile", {
      event: AUTH_STORE_LOG_EVENTS.PROFILE_SWITCH_FAILED,
      profile_id,
      error: token_result.error,
    });
    return false;
  }
  return activate_switched_profile(context, target_profile, token_result.data);
}

export async function logout_auth_store(
  context: AuthStoreContext,
): Promise<void> {
  await clear_auth_storage();
  sync_user_context_with_event_bus({
    status: EVENT_BUS_USER_CONTEXT_STATUS.CLEARED,
  });
  context.set(build_initial_auth_state());
  console.log("[AuthStore] Logged out", {
    event: AUTH_STORE_LOG_EVENTS.LOGGED_OUT,
  });
}
