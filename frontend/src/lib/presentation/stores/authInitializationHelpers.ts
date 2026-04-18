import { get } from "svelte/store";

import {
  clerk_session,
  is_clerk_loaded,
} from "$lib/adapters/iam/clerkAuthService";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import { get_organization_repository } from "$lib/adapters/repositories/InBrowserOrganizationRepository";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { get_team_repository } from "$lib/adapters/repositories/InBrowserTeamRepository";
import type { AuthToken } from "$lib/core/interfaces/ports";

import {
  build_profiles_with_public_viewer,
  clear_auth_storage,
  load_sidebar_menu_for_role,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import {
  type ClerkEmailState,
  find_profile_by_id,
  type RestoredAnonymousSessionState,
  type RestoredSignedInSessionState,
} from "./authInitializationContracts";
import {
  type AuthState,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";
import { load_profiles_from_repository } from "./profileLoader";

export async function wait_for_clerk(): Promise<boolean> {
  if (get(is_clerk_loaded)) return true;
  console.log("[AuthStore] Waiting for Clerk to load before initializing...");
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

export async function try_restore_anonymous_session(
  available_profiles: UserProfile[],
  saved_token_raw: string,
): Promise<RestoredAnonymousSessionState> {
  const local_auth_adapter = get_authentication_adapter(
    get_system_user_repository(),
  );
  const verify_result = await local_auth_adapter.verify_token(saved_token_raw);
  if (
    !verify_result.success ||
    !verify_result.data.is_valid ||
    !verify_result.data.payload
  ) {
    console.warn(
      "[AuthStore] Saved token invalid or profile missing — clearing and defaulting to public viewer",
      { event: "auth_saved_token_invalid_on_anonymous_restore" },
    );
    await clear_auth_storage();
    return { status: "not_restored" };
  }
  const switched_profile_state = find_profile_by_id(
    available_profiles,
    verify_result.data.payload.user_id,
  );

  if (switched_profile_state.status !== "found") {
    await clear_auth_storage();
    return { status: "not_restored" };
  }

  const switched_profile = switched_profile_state.profile;
  const restored_token: AuthToken = {
    payload: verify_result.data.payload,
    signature: saved_token_raw.split(".")[2],
    raw_token: saved_token_raw,
  };
  sync_user_context_with_event_bus({
    status: "present",
    profile: switched_profile,
  });
  const sidebar_menu_items = await load_sidebar_menu_for_role(
    switched_profile.role,
  );
  await sync_branding_with_profile({
    status: "present",
    profile: switched_profile,
  });
  console.log("[AuthStore] Restored switched profile from saved token", {
    event: "auth_switched_profile_restored",
    display_name: switched_profile.display_name,
    role: switched_profile.role,
  });
  return {
    status: "restored",
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

export async function create_default_anonymous_state(
  available_profiles: UserProfile[],
): Promise<AuthState> {
  console.log("[AuthStore] User not signed in, defaulting to public viewer", {
    event: "auth_defaulted_to_public_viewer",
  });
  const public_profile = available_profiles.find(
    (profile) => profile.id === "public-viewer",
  )!;
  return {
    current_token: create_missing_auth_token_state(),
    current_profile: create_present_auth_profile_state(public_profile),
    available_profiles,
    sidebar_menu_items: await load_sidebar_menu_for_role("public_viewer"),
    is_initialized: true,
    is_demo_session: true,
  };
}

export async function try_restore_signed_in_session(
  available_profiles: UserProfile[],
  saved_token_raw: string,
  clerk_email_state: ClerkEmailState,
): Promise<RestoredSignedInSessionState> {
  const auth_adapter = get_authentication_adapter(get_system_user_repository());
  const verify_result = await auth_adapter.verify_token(saved_token_raw);
  if (
    !verify_result.success ||
    !verify_result.data.is_valid ||
    !verify_result.data.payload
  ) {
    console.warn(
      "[AuthStore] Saved token is invalid or expired, clearing storage",
    );
    await clear_auth_storage();
    return { status: "not_restored" };
  }

  const verification = verify_result.data;
  const verified_payload = verification.payload;

  if (!verified_payload) {
    console.warn(
      "[AuthStore] Saved token is invalid or expired, clearing storage",
    );
    await clear_auth_storage();
    return { status: "not_restored" };
  }

  const token_profile_state = find_profile_by_id(
    available_profiles,
    verified_payload.user_id,
  );
  const token_matches_clerk_user =
    clerk_email_state.status !== "present" ||
    (token_profile_state.status === "found" &&
      token_profile_state.profile.email.toLowerCase() ===
        clerk_email_state.email);

  if (token_profile_state.status !== "found" || !token_matches_clerk_user) {
    const token_profile_email =
      token_profile_state.status === "found"
        ? token_profile_state.profile.email
        : "unknown";
    const clerk_email =
      clerk_email_state.status === "present"
        ? clerk_email_state.email
        : "missing";
    console.warn(
      `[AuthStore] Saved token belongs to a different user (token: ${token_profile_email}, clerk: ${clerk_email}). Clearing stale token.`,
    );
    await clear_auth_storage();
    return { status: "not_restored" };
  }

  const token_profile = token_profile_state.profile;
  console.log(
    `[AuthStore] Restored session for profile: ${token_profile.display_name}`,
  );
  return {
    status: "restored",
    profile: token_profile,
    token: {
      payload: verified_payload,
      signature: saved_token_raw.split(".")[2],
      raw_token: saved_token_raw,
    },
  };
}

export function get_clerk_email(): ClerkEmailState {
  const clerk_state = get(clerk_session);

  if (clerk_state.user_state.status !== "present") {
    return { status: "missing" };
  }

  const email_address = clerk_state.user_state.user.email_address;

  if (!email_address) {
    return { status: "missing" };
  }

  return {
    status: "present",
    email: email_address.toLowerCase(),
  };
}
