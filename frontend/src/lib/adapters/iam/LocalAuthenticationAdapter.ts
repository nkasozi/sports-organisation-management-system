import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type {
  AuthenticationPort,
  AuthToken,
  AuthTokenPayload,
  AuthTokenPayloadCore,
  AuthVerificationResult,
  UserRole,
} from "$lib/core/interfaces/ports";
import {
  create_auth_token_payload,
  USER_ROLE_DISPLAY_NAMES,
} from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  type AuthCache,
  create_auth_cache,
} from "$lib/infrastructure/cache/AuthCache";
import {
  base64_url_decode,
  base64_url_encode,
  create_hmac_signature,
  create_token_header,
  verify_hmac_signature,
} from "$lib/infrastructure/utils/JwtTokenUtils";

import { get_local_auth_secret_key } from "./localAuthenticationSessionKey";

const VERIFICATION_CACHE_MAX_ENTRIES = 50;
const VERIFICATION_CACHE_TTL_MS = 30 * 60 * 1000;
const TOKEN_EXPIRY_DAYS = 7;

function is_user_role(value: unknown): value is UserRole {
  return typeof value === "string" && value in USER_ROLE_DISPLAY_NAMES;
}

function is_record_value(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parse_decoded_token_payload(
  decoded_payload: unknown,
): Result<AuthTokenPayload> {
  if (!is_record_value(decoded_payload)) {
    return create_failure_result("Token payload is invalid");
  }

  const payload_record = decoded_payload;

  if (typeof payload_record.user_id !== "string") {
    return create_failure_result("Token payload is invalid");
  }

  if (typeof payload_record.email !== "string") {
    return create_failure_result("Token payload is invalid");
  }

  if (typeof payload_record.display_name !== "string") {
    return create_failure_result("Token payload is invalid");
  }

  if (!is_user_role(payload_record.role)) {
    return create_failure_result("Token payload is invalid");
  }

  if (typeof payload_record.organization_id !== "string") {
    return create_failure_result("Token payload is invalid");
  }

  if (typeof payload_record.team_id !== "string") {
    return create_failure_result("Token payload is invalid");
  }

  if (typeof payload_record.issued_at !== "number") {
    return create_failure_result("Token payload is invalid");
  }

  if (typeof payload_record.expires_at !== "number") {
    return create_failure_result("Token payload is invalid");
  }

  return create_auth_token_payload({
    user_id: payload_record.user_id,
    email: payload_record.email,
    display_name: payload_record.display_name,
    role: payload_record.role,
    organization_id: payload_record.organization_id,
    team_id: payload_record.team_id,
    issued_at: payload_record.issued_at,
    expires_at: payload_record.expires_at,
  });
}

function is_public_viewer_token_payload(payload: AuthTokenPayload): boolean {
  return payload.role === "public_viewer";
}

export class LocalAuthenticationAdapter implements AuthenticationPort {
  private system_user_repository: InBrowserSystemUserRepository;
  private verification_cache: AuthCache<AuthVerificationResult>;

  constructor(
    system_user_repository: InBrowserSystemUserRepository,
    verification_cache?: AuthCache<AuthVerificationResult>,
  ) {
    this.system_user_repository = system_user_repository;
    this.verification_cache =
      verification_cache ??
      create_auth_cache<AuthVerificationResult>({
        max_entries: VERIFICATION_CACHE_MAX_ENTRIES,
        fallback_ttl_ms: VERIFICATION_CACHE_TTL_MS,
      });
  }

  get_verification_cache(): AuthCache<AuthVerificationResult> {
    return this.verification_cache;
  }

  async generate_token(
    payload_input: AuthTokenPayloadCore,
  ): Promise<Result<AuthToken>> {
    const secret_key_result = get_local_auth_secret_key();
    if (!secret_key_result.success) return secret_key_result;
    try {
      const now = Date.now();
      const payload: AuthTokenPayload = {
        ...payload_input,
        issued_at: now,
        expires_at: now + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      };
      const header = create_token_header();
      const encoded_payload = base64_url_encode(JSON.stringify(payload));
      const signature = await create_hmac_signature(
        `${header}.${encoded_payload}`,
        secret_key_result.data,
      );
      console.log("[Auth] Token generated", {
        event: "token_generated",
        user_id: payload.user_id,
        role: payload.role,
      });
      return create_success_result({
        payload,
        signature,
        raw_token: `${header}.${encoded_payload}.${signature}`,
      });
    } catch (error) {
      console.warn("[LocalAuth] Failed to generate token", {
        event: "repository_generate_token_failed",
        error: String(error),
      });
      return create_failure_result(`Failed to generate token: ${error}`);
    }
  }

  async verify_token(
    raw_token: string,
  ): Promise<Result<AuthVerificationResult>> {
    if (!raw_token || raw_token.trim().length === 0)
      return create_success_result({
        is_valid: false,
        error_message: "Token is empty",
      });
    const cached_result = this.verification_cache.get_or_miss(raw_token);
    if (cached_result.is_hit && cached_result.value) {
      console.log("[Auth] Cache HIT for token verification", {
        event: "token_cache_hit",
      });
      return create_success_result(cached_result.value);
    }
    const verification_result =
      await this.verify_token_without_cache(raw_token);
    if (verification_result.is_valid) {
      this.verification_cache.set(raw_token, verification_result);
    }
    return create_success_result(verification_result);
  }

  private async verify_token_without_cache(
    raw_token: string,
  ): Promise<AuthVerificationResult> {
    const parts = raw_token.split(".");
    if (parts.length !== 3)
      return { is_valid: false, error_message: "Invalid token format" };
    const [header, encoded_payload, signature] = parts;
    const secret_key_result = get_local_auth_secret_key();
    if (!secret_key_result.success)
      return { is_valid: false, error_message: secret_key_result.error };
    const is_signature_valid = await verify_hmac_signature(
      `${header}.${encoded_payload}`,
      signature,
      secret_key_result.data,
    );
    if (!is_signature_valid) {
      console.warn("[Auth] Token signature verification failed", {
        event: "token_tampered",
      });
      return { is_valid: false, error_message: "Token has been tampered with" };
    }
    const payload_result = this.parse_token_payload(raw_token);
    if (!payload_result.success)
      return { is_valid: false, error_message: payload_result.error };
    const payload = payload_result.data;
    if (Date.now() > payload.expires_at) {
      console.warn("[Auth] Token has expired", { event: "token_expired" });
      return { is_valid: false, error_message: "Token has expired" };
    }

    if (is_public_viewer_token_payload(payload)) {
      console.log("[Auth] Token verified", {
        event: "token_verified",
        user_id: payload.user_id,
        role: payload.role,
      });
      return { is_valid: true, payload };
    }

    const user_result = await this.system_user_repository.find_by_email(
      payload.email,
    );
    if (!user_result.success || user_result.data.items.length === 0) {
      console.warn("[Auth] User not found for token", {
        event: "token_user_not_found",
      });
      return { is_valid: false, error_message: "User not found" };
    }
    console.log("[Auth] Token verified", {
      event: "token_verified",
      user_id: user_result.data.items[0].id,
    });
    return { is_valid: true, payload, system_user: user_result.data.items[0] };
  }

  private parse_token_payload(raw_token: string): Result<AuthTokenPayload> {
    if (!raw_token || raw_token.trim().length === 0)
      return create_failure_result("Token is empty");
    const parts = raw_token.split(".");
    if (parts.length !== 3)
      return create_failure_result(
        "Token format is invalid (expected 3 parts)",
      );
    try {
      return parse_decoded_token_payload(
        JSON.parse(base64_url_decode(parts[1])),
      );
    } catch (error) {
      console.error("[Auth] Failed to decode token", {
        event: "token_decode_failed",
        error: String(error),
      });
      return create_failure_result("Failed to decode token payload");
    }
  }
}

type AuthenticationAdapterState =
  | { status: "uninitialized" }
  | { status: "ready"; adapter: LocalAuthenticationAdapter };

let authentication_adapter_state: AuthenticationAdapterState = {
  status: "uninitialized",
};

export function get_authentication_adapter(
  system_user_repository: InBrowserSystemUserRepository,
): LocalAuthenticationAdapter {
  if (authentication_adapter_state.status === "ready") {
    return authentication_adapter_state.adapter;
  }

  const adapter = new LocalAuthenticationAdapter(system_user_repository);
  authentication_adapter_state = { status: "ready", adapter };

  return adapter;
}
