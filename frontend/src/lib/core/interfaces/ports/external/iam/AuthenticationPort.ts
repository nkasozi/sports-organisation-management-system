import type { SystemUser } from "$lib/core/entities/SystemUser";
import type { AsyncResult } from "../../../../types/Result";

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player"
  | "public_viewer";

export const USER_ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Organisation Admin",
  officials_manager: "Officials Manager",
  team_manager: "Team Manager",
  official: "Official",
  player: "Player",
  public_viewer: "Public Viewer",
};

export const USER_ROLE_ORDER: UserRole[] = [
  "super_admin",
  "org_admin",
  "officials_manager",
  "team_manager",
  "official",
  "player",
  "public_viewer",
];

export const ANY_VALUE = "*";

export interface AuthTokenPayload {
  user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  organization_id: string;
  team_id: string;
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
  ): AsyncResult<AuthToken>;

  verify_token(raw_token: string): AsyncResult<AuthVerificationResult>;
}
