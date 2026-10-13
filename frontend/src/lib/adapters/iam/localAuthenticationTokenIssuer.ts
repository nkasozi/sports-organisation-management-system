import type {
  AuthToken,
  AuthTokenPayload,
  AuthTokenPayloadCore,
} from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  base64_url_encode,
  create_hmac_signature,
  create_token_header,
} from "$lib/infrastructure/utils/JwtTokenUtils";

import { get_local_auth_secret_key } from "./localAuthenticationSessionKey";
import {
  LOCAL_TOKEN_LOG_EVENT,
  LOCAL_TOKEN_MESSAGE,
  TOKEN_PART_SEPARATOR,
} from "./localAuthenticationTokenConstants";

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

async function sign_token_payload(
  payload: AuthTokenPayload,
  secret_key: string,
): Promise<AuthToken> {
  const header = create_token_header();
  const encoded_payload = base64_url_encode(JSON.stringify(payload));
  const signing_input = [header, encoded_payload].join(TOKEN_PART_SEPARATOR);
  const signature = await create_hmac_signature(signing_input, secret_key);
  return {
    payload,
    signature,
    raw_token: [signing_input, signature].join(TOKEN_PART_SEPARATOR),
  };
}

export async function issue_local_auth_token(
  payload_input: AuthTokenPayloadCore,
  issued_at_ms: number,
): Promise<Result<AuthToken>> {
  const secret_key_result = get_local_auth_secret_key();
  if (!secret_key_result.success) return secret_key_result;
  const payload: AuthTokenPayload = {
    ...payload_input,
    issued_at: issued_at_ms,
    expires_at: issued_at_ms + TOKEN_EXPIRY_MS,
  };
  try {
    const token = await sign_token_payload(payload, secret_key_result.data);
    console.log("[Auth] Token generated", {
      event: LOCAL_TOKEN_LOG_EVENT.GENERATED,
      user_id: payload.user_id,
      role: payload.role,
    });
    return create_success_result(token);
  } catch (error) {
    console.error("[Auth] Failed to generate token", {
      event: LOCAL_TOKEN_LOG_EVENT.GENERATION_FAILED,
      user_id: payload_input.user_id,
      error: String(error),
    });
    return create_failure_result(LOCAL_TOKEN_MESSAGE.GENERATION_FAILED);
  }
}
