import { get } from "svelte/store";

import {
  clerk_session,
  is_clerk_loaded,
  is_signed_in,
} from "$lib/adapters/iam/clerkAuthService";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import { get_organization_repository } from "$lib/adapters/repositories/InBrowserOrganizationRepository";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { AuthToken } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  build_profiles_with_public_viewer,
  clear_auth_storage,
  generate_token_for_profile,
  load_saved_token,
  load_sidebar_menu_for_role,
  save_profile_id,
  save_token,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import type { AuthState, UserProfile } from "./authTypes";
import { load_profiles_from_repository } from "./profileLoader";

async function wait_for_clerk(): Promise<boolean> {
  const clerk_already_loaded = get(is_clerk_loaded);
  if (clerk_already_loaded) return true;

  console.log("[AuthStore] Waiting for Clerk to load before initializing...");
  await new Promise<void>((resolve) => {
    const unsub = is_clerk_loaded.subscribe((loaded) => {
      if (!loaded) return;
      unsub();
      resolve();
    });
  });
  return true;
}

async function load_available_profiles(): Promise<UserProfile[]> {
  const repository = get_system_user_repository();
  const organization_repository = get_organization_repository();
  const loaded_profiles = await load_profiles_from_repository(
    repository,
    organization_repository,
  );
  return build_profiles_with_public_viewer(loaded_profiles);
}

async function try_restore_anonymous_session(
  available_profiles: UserProfile[],
  saved_token_raw: string,
): Promise<AuthState | null> {
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
    return null;
  }

  const switched_profile =
    available_profiles.find(
      (p) => p.id === verify_result.data.payload?.user_id,
    ) ?? null;
  if (!switched_profile) {
    await clear_auth_storage();
    return null;
  }

  const restored_token: AuthToken = {
    payload: verify_result.data.payload,
    signature: saved_token_raw.split(".")[2],
    raw_token: saved_token_raw,
  };
  sync_user_context_with_event_bus(switched_profile);
  const sidebar_menu_items = await load_sidebar_menu_for_role(
    switched_profile.role,
  );
  await sync_branding_with_profile(switched_profile);
  console.log("[AuthStore] Restored switched profile from saved token", {
    event: "auth_switched_profile_restored",
    display_name: switched_profile.display_name,
    role: switched_profile.role,
  });

  return {
    current_token: restored_token,
    current_profile: switched_profile,
    available_profiles,
    sidebar_menu_items,
    is_initialized: true,
    is_demo_session: true,
  };
}

async function create_default_anonymous_state(
  available_profiles: UserProfile[],
): Promise<AuthState> {
  console.log("[AuthStore] User not signed in, defaulting to public viewer", {
    event: "auth_defaulted_to_public_viewer",
  });
  const public_profile = available_profiles.find(
    (p) => p.id === "public-viewer",
  )!;
  const sidebar_menu_items = await load_sidebar_menu_for_role("public_viewer");
  return {
    current_token: null,
    current_profile: public_profile,
    available_profiles,
    sidebar_menu_items,
    is_initialized: true,
    is_demo_session: true,
  };
}

async function try_restore_signed_in_session(
  available_profiles: UserProfile[],
  saved_token_raw: string,
  clerk_email: string | null,
): Promise<{ profile: UserProfile; token: AuthToken } | null> {
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
    return null;
  }

  const verification = verify_result.data;
  const token_profile =
    available_profiles.find((p) => p.id === verification.payload?.user_id) ??
    null;
  const token_matches_clerk_user =
    clerk_email === null ||
    (token_profile !== null &&
      token_profile.email.toLowerCase() === clerk_email);

  if (!token_profile || !token_matches_clerk_user || !verification.payload) {
    console.warn(
      `[AuthStore] Saved token belongs to a different user (token: ${token_profile?.email ?? "unknown"}, clerk: ${clerk_email}). Clearing stale token.`,
    );
    await clear_auth_storage();
    return null;
  }

  console.log(
    `[AuthStore] Restored session for profile: ${token_profile.display_name}`,
  );
  return {
    profile: token_profile,
    token: {
      payload: verification.payload,
      signature: saved_token_raw.split(".")[2],
      raw_token: saved_token_raw,
    },
  };
}

export async function execute_auth_initialization(
  current_state: AuthState,
  state_setter: (state: AuthState) => void,
): Promise<Result<true>> {
  if (current_state.is_initialized) return create_success_result(true);

  await wait_for_clerk();
  const available_profiles = await load_available_profiles();
  const saved_token_raw = await load_saved_token();
  const user_is_signed_in = get(is_signed_in);

  if (!user_is_signed_in) {
    if (saved_token_raw) {
      const restored = await try_restore_anonymous_session(
        available_profiles,
        saved_token_raw,
      );
      if (restored) {
        state_setter(restored);
        return create_success_result(true);
      }
    }
    state_setter(await create_default_anonymous_state(available_profiles));
    return create_success_result(true);
  }

  const clerk_state = get(clerk_session);
  const clerk_email = clerk_state.user?.email_address?.toLowerCase() ?? null;
  let current_profile: UserProfile | null = null;
  let current_token: AuthToken | null = null;

  if (saved_token_raw) {
    const restored = await try_restore_signed_in_session(
      available_profiles,
      saved_token_raw,
      clerk_email,
    );
    if (restored) {
      current_profile = restored.profile;
      current_token = restored.token;
    }
  }

  if (!current_profile) {
    const clerk_local_profile = clerk_email
      ? (available_profiles.find(
          (p) => p.email.toLowerCase() === clerk_email,
        ) ?? null)
      : null;

    if (!clerk_local_profile) {
      console.error("[AuthStore] Cannot initialize", {
        event: "auth_local_profile_not_found",
        clerk_email,
      });
      return create_failure_result(
        `no local profile found for Clerk email: ${clerk_email} — user may not be registered`,
      );
    }

    current_profile = clerk_local_profile;
    const token_result = await generate_token_for_profile(current_profile);
    if (!token_result.success) {
      console.error("[AuthStore] Failed to generate token", {
        event: "auth_token_generation_failed",
        error: token_result.error,
      });
      return create_failure_result(token_result.error);
    }
    current_token = token_result.data;
    await save_token(current_token.raw_token);
    await save_profile_id(current_profile.id);
    console.log("[AuthStore] Initialized profile via Clerk email match", {
      event: "auth_initialized_from_clerk_email",
      display_name: current_profile.display_name,
      role: current_profile.role,
    });
  }

  sync_user_context_with_event_bus(current_profile);
  const sidebar_menu_items = await load_sidebar_menu_for_role(
    current_profile.role,
  );

  state_setter({
    current_token,
    current_profile,
    available_profiles,
    sidebar_menu_items,
    is_initialized: true,
    is_demo_session: false,
  });

  await sync_branding_with_profile(current_profile);
  return create_success_result(true);
}
