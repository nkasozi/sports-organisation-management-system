import type {
  AuthenticationPort,
  AuthVerificationResult,
  SystemUserRepository,
  UserRole,
} from "$lib/core/interfaces/ports";

import { lookup_role_for_email, ROLE_LOOKUP_STATUS } from "./authRoleLookup";
import {
  IAM_LOG_EVENT,
  IAM_MESSAGE,
  TOKEN_EXPIRED_MARKER,
} from "./iamConstants";

export const TOKEN_ROLE_STATUS = {
  RESOLVED: "resolved",
  TOKEN_INVALID: "token_invalid",
  TOKEN_EXPIRED: "token_expired",
  USER_REJECTED: "user_rejected",
  LOOKUP_FAILED: "lookup_failed",
} as const;

export type TokenRoleResolution =
  | { status: typeof TOKEN_ROLE_STATUS.RESOLVED; role: UserRole }
  | { status: typeof TOKEN_ROLE_STATUS.TOKEN_INVALID; message: string }
  | { status: typeof TOKEN_ROLE_STATUS.TOKEN_EXPIRED; message: string }
  | { status: typeof TOKEN_ROLE_STATUS.USER_REJECTED; message: string }
  | { status: typeof TOKEN_ROLE_STATUS.LOOKUP_FAILED; message: string };

interface TokenRoleRequest {
  auth_port: AuthenticationPort;
  system_user_repository: SystemUserRepository;
  raw_token: string;
}

function classify_rejected_token(
  verification: AuthVerificationResult,
): TokenRoleResolution {
  const message =
    verification.error_message || IAM_MESSAGE.TOKEN_VERIFICATION_FAILED;
  const is_expired = message.includes(TOKEN_EXPIRED_MARKER);
  console.warn("[LocalAuthorizationAdapter] Token rejected", {
    event: IAM_LOG_EVENT.TOKEN_REJECTED,
    is_expired,
  });
  return is_expired
    ? { status: TOKEN_ROLE_STATUS.TOKEN_EXPIRED, message }
    : { status: TOKEN_ROLE_STATUS.TOKEN_INVALID, message };
}

export async function resolve_token_role(
  request: TokenRoleRequest,
): Promise<TokenRoleResolution> {
  const verification_result = await request.auth_port.verify_token(
    request.raw_token,
  );
  if (!verification_result.success) {
    console.error("[LocalAuthorizationAdapter] Token verification failed", {
      event: IAM_LOG_EVENT.TOKEN_VERIFICATION_FAILED,
      error: verification_result.error,
    });
    return {
      status: TOKEN_ROLE_STATUS.LOOKUP_FAILED,
      message: verification_result.error,
    };
  }
  const verification = verification_result.data;
  if (!verification.is_valid || !verification.payload)
    return classify_rejected_token(verification);
  const lookup = await lookup_role_for_email(
    request.system_user_repository,
    verification.payload.email,
  );
  switch (lookup.status) {
    case ROLE_LOOKUP_STATUS.FOUND:
      return { status: TOKEN_ROLE_STATUS.RESOLVED, role: lookup.role };
    case ROLE_LOOKUP_STATUS.USER_REJECTED:
      return {
        status: TOKEN_ROLE_STATUS.USER_REJECTED,
        message: lookup.message,
      };
    case ROLE_LOOKUP_STATUS.LOOKUP_FAILED:
      return {
        status: TOKEN_ROLE_STATUS.LOOKUP_FAILED,
        message: lookup.message,
      };
  }
}
