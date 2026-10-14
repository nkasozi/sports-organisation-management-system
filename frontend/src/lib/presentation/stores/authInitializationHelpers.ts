import { get } from "svelte/store";

import {
  clerk_session,
  is_clerk_loaded,
} from "$lib/adapters/iam/clerkAuthService";
import { CLERK_PRESENCE_STATUS } from "$lib/adapters/iam/clerkAuthTypes";
import { get_organization_repository } from "$lib/adapters/repositories/InBrowserOrganizationRepository";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { get_team_repository } from "$lib/adapters/repositories/InBrowserTeamRepository";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { try_restore_anonymous_session as restore_anonymous_session_from_profiles } from "./authAnonymousSessionRestore";
import {
  build_profiles_with_public_viewer,
  load_sidebar_menu_for_role,
} from "./authHelpers";
import type {
  ClerkEmailState,
  RestoredAnonymousSessionState,
} from "./authInitializationContracts";
import {
  AUTH_STORE_LOG_EVENTS,
  PUBLIC_VIEWER_PROFILE_ID,
  PUBLIC_VIEWER_ROLE,
} from "./authStoreConstants";
import {
  type AuthProfileState,
  type AuthState,
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  type UserProfile,
} from "./authTypes";
import { select_demo_profiles } from "./demoProfileSelection";
import { load_profiles_from_repository } from "./profileLoader";

export { try_restore_signed_in_session } from "./authSignedInSessionRestore";

export async function wait_for_clerk(): Promise<boolean> {
  if (get(is_clerk_loaded)) return true;
  console.log("[AuthStore] Waiting for Clerk to load before initializing", {
    event: AUTH_STORE_LOG_EVENTS.WAITING_FOR_CLERK,
  });
  await new Promise<void>((resolve) => {
    const unsubscribe = is_clerk_loaded.subscribe((loaded) => {
      if (!loaded) return;
      unsubscribe();
      resolve();
    });
  });
  return true;
}

export async function load_available_profiles(): Promise<UserProfile[]> {
  const loaded_profiles = await load_profiles_from_repository(
    get_system_user_repository(),
    get_organization_repository(),
    get_team_repository(),
  );
  return build_profiles_with_public_viewer(loaded_profiles);
}

function resolve_public_viewer_profile_state(
  available_profiles: UserProfile[],
): AuthProfileState {
  const public_profile = available_profiles.find(
    (profile) => profile.id === PUBLIC_VIEWER_PROFILE_ID,
  );
  if (public_profile) return create_present_auth_profile_state(public_profile);
  console.error("[AuthStore] Public viewer profile is missing", {
    event: AUTH_STORE_LOG_EVENTS.PUBLIC_VIEWER_PROFILE_MISSING,
    available_profile_count: available_profiles.length,
  });
  return create_missing_auth_profile_state();
}

export function try_restore_anonymous_session(
  available_profiles: UserProfile[],
  saved_token_raw: string,
): Promise<RestoredAnonymousSessionState> {
  return restore_anonymous_session_from_profiles(
    select_demo_profiles(available_profiles),
    saved_token_raw,
  );
}

export async function create_default_anonymous_state(
  loaded_profiles: UserProfile[],
): Promise<AuthState> {
  const available_profiles = select_demo_profiles(loaded_profiles);
  console.log("[AuthStore] User not signed in, defaulting to public viewer", {
    event: AUTH_STORE_LOG_EVENTS.DEFAULTED_TO_PUBLIC_VIEWER,
  });
  return {
    current_token: create_missing_auth_token_state(),
    current_profile: resolve_public_viewer_profile_state(available_profiles),
    available_profiles,
    sidebar_menu_items: await load_sidebar_menu_for_role(PUBLIC_VIEWER_ROLE),
    is_initialized: true,
    is_demo_session: true,
  };
}

export function get_clerk_email(): ClerkEmailState {
  const clerk_state = get(clerk_session);

  if (clerk_state.user_state.status !== CLERK_PRESENCE_STATUS.PRESENT) {
    return { status: PRESENCE_STATUS.MISSING };
  }

  const email_address = clerk_state.user_state.user.email_address;

  if (!email_address) {
    return { status: PRESENCE_STATUS.MISSING };
  }

  return {
    status: PRESENCE_STATUS.PRESENT,
    email: email_address.toLowerCase(),
  };
}
