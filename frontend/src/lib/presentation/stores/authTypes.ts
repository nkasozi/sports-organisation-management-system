import type { SystemUser } from "$lib/core/entities/SystemUser";
import type { AuthToken, UserRole } from "$lib/core/interfaces/ports";
import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";

export interface ConvexUserProfile {
  local_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  team_name?: string;
  player_id?: string;
  official_id?: string;
  status?: string;
}

export interface ConvexGetProfileResponse {
  success: boolean;
  data?: ConvexUserProfile;
  error?: string;
}

export interface UserProfile {
  id: ScalarValueInput<SystemUser["id"]>;
  display_name: string;
  email: ScalarValueInput<SystemUser["email"]> | "";
  role: UserRole;
  organization_id: ScalarValueInput<SystemUser["organization_id"]> | "";
  organization_name: string;
  team_id: ScalarValueInput<NonNullable<SystemUser["team_id"]>> | "";
  team_name?: string;
  player_id?: ScalarValueInput<NonNullable<SystemUser["player_id"]>>;
  official_id?: ScalarValueInput<NonNullable<SystemUser["official_id"]>>;
}

export type AuthTokenState =
  | { status: "missing" }
  | { status: "present"; token: AuthToken };

export type AuthProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserProfile };

export function create_missing_auth_token_state(): AuthTokenState {
  return { status: "missing" };
}

export function create_present_auth_token_state(
  token: AuthToken,
): AuthTokenState {
  return { status: "present", token };
}

export function create_missing_auth_profile_state(): AuthProfileState {
  return { status: "missing" };
}

export function create_present_auth_profile_state(
  profile: UserProfile,
): AuthProfileState {
  return { status: "present", profile };
}

export function normalize_auth_profile_state(
  current_profile: unknown,
): AuthProfileState {
  if (!current_profile || typeof current_profile !== "object") {
    return create_missing_auth_profile_state();
  }

  if ("status" in current_profile) {
    return current_profile as AuthProfileState;
  }

  return create_present_auth_profile_state(current_profile as UserProfile);
}

export interface AuthState {
  current_token: AuthTokenState;
  current_profile: AuthProfileState;
  available_profiles: UserProfile[];
  sidebar_menu_items: SidebarMenuGroup[];
  is_initialized: boolean;
  is_demo_session: boolean;
}

export const AUTH_STORAGE_KEY = "sports-org-auth-token";
export const PROFILE_STORAGE_KEY = "sports-org-current-profile-id";
