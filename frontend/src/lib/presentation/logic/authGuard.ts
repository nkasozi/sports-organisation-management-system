import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { auth_store } from "../stores/auth";
import { access_denial_store } from "../stores/accessDenial";
import type { UserProfile } from "../stores/auth";
import type { UserRole } from "$lib/core/interfaces/ports/AuthenticationPort";
import { can_role_access_route } from "$lib/adapters/services/LocalAuthorizationAdapter";

export interface AuthGuardResult {
  success: boolean;
  profile: UserProfile | null;
  error_message: string;
}

function get_role_display_name(role: UserRole): string {
  const display_names: Record<UserRole, string> = {
    super_admin: "Super Admin",
    org_admin: "Organisation Admin",
    officials_manager: "Officials Manager",
    team_manager: "Team Manager",
    official: "Official",
    player: "Player",
  };
  return display_names[role] || role;
}

export async function check_route_access(
  pathname: string,
): Promise<{ allowed: boolean; message: string }> {
  const auth_state = get(auth_store);

  if (!auth_state.is_initialized) {
    await auth_store.initialize();
  }

  const updated_state = get(auth_store);
  const profile = updated_state.current_profile;

  if (!profile) {
    return {
      allowed: false,
      message: "Please select a user profile to access this page.",
    };
  }

  const result = can_role_access_route(profile.role, pathname);

  if (!result.allowed) {
    return {
      allowed: false,
      message: `Your current role (${get_role_display_name(profile.role)}) does not have access to this page. ${result.reason}`,
    };
  }

  return { allowed: true, message: "" };
}

export async function ensure_route_access(pathname: string): Promise<boolean> {
  const result = await check_route_access(pathname);

  if (!result.allowed) {
    access_denial_store.set_denial(pathname, result.message);
    goto("/");
    return false;
  }

  return true;
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
