import type { SystemUser } from "../../entities/SystemUser";

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player";

export const USER_ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Organisation Admin",
  officials_manager: "Officials Manager",
  team_manager: "Team Manager",
  official: "Official",
  player: "Player",
};

export const USER_ROLE_ORDER: UserRole[] = [
  "super_admin",
  "org_admin",
  "officials_manager",
  "team_manager",
  "official",
  "player",
];

export type Permission =
  | "manage_organizations"
  | "manage_competitions"
  | "manage_teams"
  | "manage_players"
  | "manage_officials"
  | "manage_fixtures"
  | "manage_users"
  | "view_reports"
  | "manage_game_events"
  | "view_own_team"
  | "view_own_profile"
  | "edit_own_profile";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "manage_organizations",
    "manage_competitions",
    "manage_teams",
    "manage_players",
    "manage_officials",
    "manage_fixtures",
    "manage_users",
    "view_reports",
    "manage_game_events",
    "view_own_team",
    "view_own_profile",
    "edit_own_profile",
  ],
  org_admin: [
    "manage_competitions",
    "manage_teams",
    "manage_players",
    "manage_officials",
    "manage_fixtures",
    "view_reports",
    "manage_game_events",
    "view_own_team",
    "view_own_profile",
    "edit_own_profile",
  ],
  officials_manager: [
    "manage_officials",
    "manage_fixtures",
    "view_reports",
    "manage_game_events",
    "view_own_profile",
    "edit_own_profile",
  ],
  team_manager: [
    "manage_players",
    "view_own_team",
    "view_reports",
    "view_own_profile",
    "edit_own_profile",
  ],
  official: ["view_own_profile", "edit_own_profile"],
  player: ["view_own_team", "view_own_profile", "edit_own_profile"],
};

export const ANY_VALUE = "*";

export interface AuthTokenPayload {
  user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  organization_id: string;
  team_id: string;
  permissions: Permission[];
  issued_at: number;
  expires_at: number;
}

export interface AuthToken {
  payload: AuthTokenPayload;
  signature: string;
  raw_token: string;
}

export interface AuthVerificationResult {
  is_valid: boolean;
  error_message?: string;
  payload?: AuthTokenPayload;
  system_user?: SystemUser;
}

export interface AuthenticationPort {
  generate_token(
    payload: Omit<AuthTokenPayload, "issued_at" | "expires_at">,
  ): Promise<AuthToken>;

  verify_token(raw_token: string): Promise<AuthVerificationResult>;

  decode_token(raw_token: string): AuthTokenPayload | null;

  get_permissions_for_role(role: UserRole): Permission[];

  has_permission(token: AuthToken, permission: Permission): boolean;

  is_token_expired(token: AuthToken): boolean;
}
