import type { Organization } from "$lib/core/entities/Organization";
import type { SystemUser } from "$lib/core/entities/SystemUser";
import type { Team } from "$lib/core/entities/Team";
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

export interface AuthState {
  current_token: AuthToken | null;
  current_profile: UserProfile | null;
  available_profiles: UserProfile[];
  sidebar_menu_items: SidebarMenuGroup[];
  is_initialized: boolean;
  is_demo_session: boolean;
}

export const AUTH_STORAGE_KEY = "sports-org-auth-token";
export const PROFILE_STORAGE_KEY = "sports-org-current-profile-id";
