import type { SystemUser } from "$lib/core/entities/SystemUser";
import type { AuthToken, UserRole } from "$lib/core/interfaces/ports";
import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

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
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; token: AuthToken };

export type AuthProfileState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserProfile };

export function create_missing_auth_token_state(): AuthTokenState {
  return { status: PRESENCE_STATUS.MISSING };
}

export function create_present_auth_token_state(
  token: AuthToken,
): AuthTokenState {
  return { status: PRESENCE_STATUS.PRESENT, token };
}

export function create_missing_auth_profile_state(): AuthProfileState {
  return { status: PRESENCE_STATUS.MISSING };
}

export function create_present_auth_profile_state(
  profile: UserProfile,
): AuthProfileState {
  return { status: PRESENCE_STATUS.PRESENT, profile };
}

const OBJECT_TYPE_NAME = "object";
const STATUS_FIELD_NAME = "status";

function is_object_value(value: unknown): value is object {
  return Boolean(value) && typeof value === OBJECT_TYPE_NAME;
}

export function normalize_auth_profile_state(
  current_profile: unknown,
): AuthProfileState {
  if (!is_object_value(current_profile)) {
    return create_missing_auth_profile_state();
  }

  if (STATUS_FIELD_NAME in current_profile) {
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
