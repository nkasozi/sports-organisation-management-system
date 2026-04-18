import { get } from "svelte/store";

import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import type { AuthToken } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  generate_token_for_profile,
  load_saved_token,
  load_sidebar_menu_for_role,
  save_profile_id,
  save_token,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import { find_profile_by_email } from "./authInitializationContracts";
import {
  create_default_anonymous_state,
  get_clerk_email,
  load_available_profiles,
  try_restore_anonymous_session,
  try_restore_signed_in_session,
  wait_for_clerk,
} from "./authInitializationHelpers";
import {
  type AuthState,
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";

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
    if (saved_token_state.status === "present") {
      const restored = await try_restore_anonymous_session(
        available_profiles,
        saved_token_state.raw_token,
      );
      if (restored.status === "restored") {
        state_setter(restored.auth_state);
        return create_success_result(true);
      }
    }
    state_setter(await create_default_anonymous_state(available_profiles));
    return create_success_result(true);
  }

  const clerk_email_state = get_clerk_email();
  let session_resolution:
    | { status: "unresolved" }
    | {
        status: "resolved";
        profile: UserProfile;
        token: AuthToken;
      } = { status: "unresolved" };

  if (saved_token_state.status === "present") {
    const restored = await try_restore_signed_in_session(
      available_profiles,
      saved_token_state.raw_token,
      clerk_email_state,
    );
    if (restored.status === "restored") {
      session_resolution = {
        status: "resolved",
        profile: restored.profile,
        token: restored.token,
      };
    }
  }

  if (session_resolution.status !== "resolved") {
    const clerk_local_profile_state =
      clerk_email_state.status === "present"
        ? find_profile_by_email(
            available_profiles,
            clerk_email_state.email.toLowerCase(),
          )
        : { status: "missing" as const };

    if (clerk_local_profile_state.status !== "found") {
      const clerk_email =
        clerk_email_state.status === "present"
          ? clerk_email_state.email
          : "missing";
      console.error("[AuthStore] Cannot initialize", {
        event: "auth_local_profile_not_found",
        clerk_email,
      });
      return create_failure_result(
        `no local profile found for Clerk email: ${clerk_email} — user may not be registered`,
      );
    }

    const clerk_local_profile = clerk_local_profile_state.profile;

    const token_result = await generate_token_for_profile(clerk_local_profile);
    if (!token_result.success) {
      console.error("[AuthStore] Failed to generate token", {
        event: "auth_token_generation_failed",
        error: token_result.error,
      });
      return create_failure_result(token_result.error);
    }
    session_resolution = {
      status: "resolved",
      profile: clerk_local_profile,
      token: token_result.data,
    };
    await save_token(token_result.data.raw_token);
    await save_profile_id(clerk_local_profile.id);
    console.log("[AuthStore] Initialized profile via Clerk email match", {
      event: "auth_initialized_from_clerk_email",
      display_name: clerk_local_profile.display_name,
      role: clerk_local_profile.role,
    });
  }

  const current_profile = session_resolution.profile;
  const current_token = session_resolution.token;

  sync_user_context_with_event_bus({
    status: "present",
    profile: current_profile,
  });
  const sidebar_menu_items = await load_sidebar_menu_for_role(
    current_profile.role,
  );

  state_setter({
    current_token: create_present_auth_token_state(current_token),
    current_profile: create_present_auth_profile_state(current_profile),
    available_profiles,
    sidebar_menu_items,
    is_initialized: true,
    is_demo_session: false,
  });

  await sync_branding_with_profile({
    status: "present",
    profile: current_profile,
  });
  return create_success_result(true);
}
