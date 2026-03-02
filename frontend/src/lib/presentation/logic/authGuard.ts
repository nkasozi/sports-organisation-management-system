import { get } from "svelte/store";
import { auth_store } from "../stores/auth";
import type { UserProfile } from "../stores/auth";

export interface AuthGuardResult {
  success: boolean;
  profile: UserProfile | null;
  error_message: string;
}

export async function ensure_auth_profile(): Promise<AuthGuardResult> {
  const auth_state = get(auth_store);

  if (!auth_state.is_initialized) {
    console.log(
      "[AuthGuard] Auth not initialized, triggering initialization...",
    );
    await auth_store.initialize();
  }

  const updated_state = get(auth_store);

  if (!updated_state.current_profile) {
    console.error("[AuthGuard] No auth profile found after initialization");
    return {
      success: false,
      profile: null,
      error_message:
        "Unable to load data: No user profile is set. Please select a user profile to continue.",
    };
  }

  return {
    success: true,
    profile: updated_state.current_profile,
    error_message: "",
  };
}

export function get_current_auth_profile(): UserProfile | null {
  const auth_state = get(auth_store);
  return auth_state.current_profile;
}

export function is_auth_initialized(): boolean {
  const auth_state = get(auth_store);
  return auth_state.is_initialized;
}
