import { get } from "svelte/store";

import type {
  AuthTokenPayload,
  AuthTokenPayloadCore,
  AuthVerificationResult,
} from "$lib/core/interfaces/ports";
import { create_auth_token_payload } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import {
  clerk_session,
  type ClerkUser as ClerkServiceUser,
  get_session_token,
} from "./clerkAuthService";
import { CLERK_PRESENCE_STATUS } from "./clerkAuthTypes";
import { IAM_MESSAGE, IAM_ROLE, IAM_SCOPE } from "./iamConstants";

const TOKEN_EXPIRY_SECONDS = 60 * 60;

export interface ClerkUserInfo {
  id: string;
  email_address: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
}

export interface ClerkSessionProvider {
  get_session_token(): Promise<Result<string>>;
  get_current_user(): Result<ClerkUserInfo>;
  is_signed_in(): boolean;
}

export function build_auth_token_payload(
  input: AuthTokenPayloadCore,
): AuthTokenPayload {
  const now_in_seconds = Math.floor(Date.now() / 1000);
  return {
    ...input,
    issued_at: now_in_seconds,
    expires_at: now_in_seconds + TOKEN_EXPIRY_SECONDS,
  };
}

function build_verification_payload_from_clerk_user(
  clerk_user: ClerkUserInfo,
): Result<AuthTokenPayload> {
  const now_in_seconds = Math.floor(Date.now() / 1000);
  return create_auth_token_payload({
    user_id: clerk_user.id,
    email: clerk_user.email_address,
    display_name:
      clerk_user.full_name ||
      `${clerk_user.first_name} ${clerk_user.last_name}`.trim(),
    role: IAM_ROLE.PUBLIC_VIEWER,
    organization_id: WILDCARD_SCOPE,
    team_id: IAM_SCOPE.ALL_TEAMS,
    issued_at: now_in_seconds,
    expires_at: now_in_seconds + TOKEN_EXPIRY_SECONDS,
  });
}

export function build_invalid_verification_result(
  error_message: string,
): AuthVerificationResult {
  return { is_valid: false, error_message };
}

export function build_valid_verification_result(
  clerk_user: ClerkUserInfo,
): AuthVerificationResult {
  const payload_result = build_verification_payload_from_clerk_user(clerk_user);

  if (!payload_result.success) {
    return build_invalid_verification_result(payload_result.error);
  }

  return {
    is_valid: true,
    payload: payload_result.data,
  };
}

function map_clerk_service_user_to_clerk_user_info(
  clerk_user: ClerkServiceUser,
): ClerkUserInfo {
  return {
    id: clerk_user.id,
    email_address: clerk_user.email_address,
    full_name: clerk_user.full_name,
    first_name: clerk_user.first_name,
    last_name: clerk_user.last_name,
    image_url: clerk_user.image_url,
  };
}

export function create_clerk_session_provider(): ClerkSessionProvider {
  return {
    get_session_token,
    get_current_user(): Result<ClerkUserInfo> {
      const session_state = get(clerk_session);
      if (session_state.user_state.status !== CLERK_PRESENCE_STATUS.PRESENT) {
        return create_failure_result(IAM_MESSAGE.CLERK_USER_UNAVAILABLE);
      }

      return create_success_result(
        map_clerk_service_user_to_clerk_user_info(
          session_state.user_state.user,
        ),
      );
    },
    is_signed_in(): boolean {
      return get(clerk_session).is_signed_in;
    },
  };
}
