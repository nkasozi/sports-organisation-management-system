import type { AuthToken, UserRole } from "$lib/core/interfaces/ports";
import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";

export interface ConvexUserProfile {
  local_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: string;
  organization_id?: string;
  team_id?: string;
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
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  organization_id: string;
  organization_name: string;
  team_id: string;
  player_id?: string;
  official_id?: string;
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
