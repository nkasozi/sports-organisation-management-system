import type { AuthTokenPayload, UserRole } from "$lib/core/interfaces/ports";
import {
  create_auth_token_payload,
  USER_ROLE_DISPLAY_NAMES,
} from "$lib/core/interfaces/ports";
import { create_failure_result, type Result } from "$lib/core/types/Result";
import {
  base64_url_decode,
  verify_hmac_signature,
} from "$lib/infrastructure/utils/JwtTokenUtils";
import {
  is_number_value,
  is_record_value,
  is_string_value,
} from "$lib/infrastructure/utils/runtimeTypeGuards";

import { IAM_ROLE } from "./iamConstants";
import { get_local_auth_secret_key } from "./localAuthenticationSessionKey";
import {
  LOCAL_TOKEN_LOG_EVENT,
  LOCAL_TOKEN_MESSAGE,
  TOKEN_PART_COUNT,
  TOKEN_PART_SEPARATOR,
} from "./localAuthenticationTokenConstants";
const STRING_PAYLOAD_FIELDS = [
  "user_id",
  "email",
  "display_name",
  "organization_id",
  "team_id",
] as const;
const NUMBER_PAYLOAD_FIELDS = ["issued_at", "expires_at"] as const;

type ValidatedPayloadRecord = Record<
  (typeof STRING_PAYLOAD_FIELDS)[number],
  string
> &
  Record<(typeof NUMBER_PAYLOAD_FIELDS)[number], number> & { role: UserRole };

function is_user_role(value: unknown): value is UserRole {
  return is_string_value(value) && value in USER_ROLE_DISPLAY_NAMES;
}

function has_valid_payload_fields(
  record: Record<string, unknown>,
): record is ValidatedPayloadRecord {
  return (
    STRING_PAYLOAD_FIELDS.every((field) => is_string_value(record[field])) &&
    is_user_role(record.role) &&
    NUMBER_PAYLOAD_FIELDS.every((field) => is_number_value(record[field]))
  );
}

export function parse_decoded_token_payload(
  decoded_payload: unknown,
): Result<AuthTokenPayload> {
  if (!is_record_value(decoded_payload)) {
    return create_failure_result(LOCAL_TOKEN_MESSAGE.PAYLOAD_INVALID);
  }
  if (!has_valid_payload_fields(decoded_payload)) {
    return create_failure_result(LOCAL_TOKEN_MESSAGE.PAYLOAD_INVALID);
  }
  return create_auth_token_payload({
    user_id: decoded_payload.user_id,
    email: decoded_payload.email,
    display_name: decoded_payload.display_name,
    role: decoded_payload.role,
    organization_id: decoded_payload.organization_id,
    team_id: decoded_payload.team_id,
    issued_at: decoded_payload.issued_at,
    expires_at: decoded_payload.expires_at,
  });
}

export function is_public_viewer_token_payload(
  payload: AuthTokenPayload,
): boolean {
  return payload.role === IAM_ROLE.PUBLIC_VIEWER;
}

export function parse_token_payload(
  raw_token: string,
): Result<AuthTokenPayload> {
  if (!raw_token || raw_token.trim().length === 0)
    return create_failure_result(LOCAL_TOKEN_MESSAGE.EMPTY);
  const parts = raw_token.split(TOKEN_PART_SEPARATOR);
  if (parts.length !== TOKEN_PART_COUNT)
    return create_failure_result(LOCAL_TOKEN_MESSAGE.FORMAT_INVALID_PARTS);
  try {
    return parse_decoded_token_payload(JSON.parse(base64_url_decode(parts[1])));
  } catch (error) {
    console.error("[Auth] Failed to decode token", {
      event: LOCAL_TOKEN_LOG_EVENT.DECODE_FAILED,
      error: String(error),
    });
    return create_failure_result(LOCAL_TOKEN_MESSAGE.DECODE_FAILED);
  }
}

export async function verify_signed_token_payload(
  raw_token: string,
): Promise<Result<AuthTokenPayload>> {
  const parts = raw_token.split(TOKEN_PART_SEPARATOR);
  if (parts.length !== TOKEN_PART_COUNT)
    return create_failure_result(LOCAL_TOKEN_MESSAGE.FORMAT_INVALID);
  const [header, encoded_payload, signature] = parts;
  const secret_key_result = get_local_auth_secret_key();
  if (!secret_key_result.success) return secret_key_result;
  const is_signature_valid = await verify_hmac_signature(
    `${header}.${encoded_payload}`,
    signature,
    secret_key_result.data,
  );
  if (!is_signature_valid) {
    console.warn("[Auth] Token signature verification failed", {
      event: LOCAL_TOKEN_LOG_EVENT.TAMPERED,
    });
    return create_failure_result(LOCAL_TOKEN_MESSAGE.TAMPERED);
  }
  const payload_result = parse_token_payload(raw_token);
  if (!payload_result.success) return payload_result;
  if (Date.now() > payload_result.data.expires_at) {
    console.warn("[Auth] Token has expired", {
      event: LOCAL_TOKEN_LOG_EVENT.EXPIRED,
    });
    return create_failure_result(LOCAL_TOKEN_MESSAGE.EXPIRED);
  }
  return payload_result;
}
