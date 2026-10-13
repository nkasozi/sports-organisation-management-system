import {
  type AuthState,
  create_missing_auth_token_state,
  type UserProfile,
} from "./authTypes";

export function create_profile(
  overrides: Partial<UserProfile> = {},
): UserProfile {
  return {
    id: "profile-1",
    display_name: "Admin User",
    email: "admin@example.com",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "Premier League",
    team_id: "",
    ...overrides,
  } as UserProfile;
}

export function create_auth_state(
  current_profile: AuthState["current_profile"],
  overrides: Partial<AuthState> = {},
): AuthState {
  return {
    current_token: create_missing_auth_token_state(),
    current_profile,
    available_profiles:
      current_profile.status === "present" ? [current_profile.profile] : [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
    ...overrides,
  } as AuthState;
}

export const AUTHORIZABLE_TO_DATA_ACTION: Record<string, string> = {
  create: "create",
  edit: "update",
  delete: "delete",
  list: "read",
  view: "read",
};
