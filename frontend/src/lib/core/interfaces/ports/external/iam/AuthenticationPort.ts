import type { SystemUser } from "$lib/core/entities/SystemUser";
import type {
  EmailAddress,
  EntityId,
  EntityScope,
  Name,
  ScalarInput,
} from "$lib/core/types/DomainScalars";
import {
  parse_email_address,
  parse_entity_id,
  parse_entity_scope,
  parse_name,
} from "$lib/core/types/DomainScalars";

import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "../../../../types/Result";

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

const INVALID_AUTH_TOKEN_PAYLOAD_ERROR = "Auth token payload is invalid";
const INVALID_DISPLAY_NAME_ERROR = "Display name is invalid";
const INVALID_ORGANIZATION_SCOPE_ERROR = "Organization scope is invalid";
const INVALID_TEAM_SCOPE_ERROR = "Team scope is invalid";
const INVALID_USER_ID_ERROR = "User ID is invalid";

export interface AuthTokenPayloadCore {
  user_id: EntityId;
  email: EmailAddress;
  display_name: Name;
  role: UserRole;
  organization_id: EntityScope;
  team_id: EntityScope;
}

export interface AuthTokenPayload extends AuthTokenPayloadCore {
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

type CreateAuthTokenPayloadCoreInput = ScalarInput<AuthTokenPayloadCore>;

type CreateAuthTokenPayloadInput = ScalarInput<AuthTokenPayload>;

function has_valid_auth_token_timestamp(value: number): boolean {
  return Number.isFinite(value);
}

export function create_auth_token_payload_core(
  input: CreateAuthTokenPayloadCoreInput,
): Result<AuthTokenPayloadCore> {
  const user_id_result = parse_entity_id(input.user_id, INVALID_USER_ID_ERROR);
  const email_result = parse_email_address(input.email);
  const display_name_result = parse_name(
    input.display_name,
    INVALID_DISPLAY_NAME_ERROR,
  );
  const organization_scope_result = parse_entity_scope(
    input.organization_id,
    INVALID_ORGANIZATION_SCOPE_ERROR,
  );
  const team_scope_result = parse_entity_scope(
    input.team_id,
    INVALID_TEAM_SCOPE_ERROR,
  );

  if (!user_id_result.success) {
    return user_id_result;
  }

  if (!email_result.success) {
    return email_result;
  }

  if (!display_name_result.success) {
    return display_name_result;
  }

  if (!organization_scope_result.success) {
    return organization_scope_result;
  }

  if (!team_scope_result.success) {
    return team_scope_result;
  }

  return create_success_result({
    user_id: user_id_result.data,
    email: email_result.data,
    display_name: display_name_result.data,
    role: input.role,
    organization_id: organization_scope_result.data,
    team_id: team_scope_result.data,
  });
}

export function create_auth_token_payload(
  input: CreateAuthTokenPayloadInput,
): Result<AuthTokenPayload> {
  if (!has_valid_auth_token_timestamp(input.issued_at)) {
    return create_failure_result(INVALID_AUTH_TOKEN_PAYLOAD_ERROR);
  }

  if (!has_valid_auth_token_timestamp(input.expires_at)) {
    return create_failure_result(INVALID_AUTH_TOKEN_PAYLOAD_ERROR);
  }

  const payload_core_result = create_auth_token_payload_core(input);

  if (!payload_core_result.success) {
    return payload_core_result;
  }

  return create_success_result({
    ...payload_core_result.data,
    issued_at: input.issued_at,
    expires_at: input.expires_at,
  });
}

export interface AuthenticationPort {
  generate_token(payload: AuthTokenPayloadCore): AsyncResult<AuthToken>;

  verify_token(raw_token: string): AsyncResult<AuthVerificationResult>;
}
