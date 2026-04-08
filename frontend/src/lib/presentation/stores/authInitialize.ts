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
import {
  create_default_anonymous_state,
  get_clerk_email,
  load_available_profiles,
  try_restore_anonymous_session,
  try_restore_signed_in_session,
  wait_for_clerk,
} from "./authInitializationHelpers";
import type { AuthState, UserProfile } from "./authTypes";

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

  const clerk_email = get_clerk_email();
  const normalized_clerk_email = clerk_email?.toLowerCase() ?? null;
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
    const clerk_local_profile = normalized_clerk_email
      ? (available_profiles.find(
          (p) => p.email.toLowerCase() === normalized_clerk_email,
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
