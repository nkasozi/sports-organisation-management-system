import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { auth_store } from "../stores/auth";
import { access_denial_store } from "../stores/accessDenial";
import type { UserProfile } from "../stores/auth";
import type { UserRole } from "$lib/core/interfaces/ports/AuthenticationPort";
import { can_role_access_route } from "$lib/adapters/services/LocalAuthorizationAdapter";
import { get_repository_container } from "$lib/infrastructure/container";
import type { CreateAuditLogInput } from "$lib/core/entities/AuditLog";

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

export async function log_access_denied_to_audit_trail(
  pathname: string,
  profile: UserProfile,
  denial_reason: string,
): Promise<boolean> {
  try {
    const container = get_repository_container();
    const audit_log_repository = container.audit_log_repository;

    const audit_input: CreateAuditLogInput = {
      entity_type: "route",
      entity_id: pathname,
      entity_display_name: pathname,
      action: "access_denied",
      changes: [
        {
          field_name: "denial_reason",
          old_value: "",
          new_value: denial_reason,
        },
        {
          field_name: "attempted_route",
          old_value: "",
          new_value: pathname,
        },
        {
          field_name: "user_role",
          old_value: "",
          new_value: profile.role,
        },
      ],
      user_id: profile.id,
      user_email: profile.email || "unknown@sportsorg.local",
      user_display_name: profile.display_name || "Unknown User",
      organization_id: profile.organization_id || "*",
      ip_address: "127.0.0.1",
      user_agent:
        typeof navigator !== "undefined"
          ? navigator.userAgent
          : "SportsOrgApp/1.0",
    };

    await audit_log_repository.create(audit_input);
    console.log(`[AuthGuard] Access denial logged to audit trail: ${pathname}`);
    return true;
  } catch (error) {
    console.error(
      "[AuthGuard] Failed to log access denial to audit trail:",
      error,
    );
    return false;
  }
}

export async function ensure_route_access(pathname: string): Promise<boolean> {
  const auth_state = get(auth_store);
  const profile = auth_state.current_profile;
  const result = await check_route_access(pathname);

  if (!result.allowed) {
    if (profile) {
      await log_access_denied_to_audit_trail(pathname, profile, result.message);
    }
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
