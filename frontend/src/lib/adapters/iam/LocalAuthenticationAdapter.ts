import type {
  AuthenticationPort,
  AuthToken,
  AuthTokenPayload,
  AuthVerificationResult,
} from "$lib/core/interfaces/ports";
import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { browser } from "$app/environment";
import {
  create_auth_cache,
  type AuthCache,
} from "$lib/infrastructure/cache/AuthCache";
import type { Result } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import {
  base64_url_encode,
  base64_url_decode,
  create_hmac_signature,
  verify_hmac_signature,
  create_token_header,
} from "$lib/infrastructure/utils/JwtTokenUtils";

const VERIFICATION_CACHE_MAX_ENTRIES = 50;
const VERIFICATION_CACHE_TTL_MS = 30 * 60 * 1000;
const TOKEN_EXPIRY_DAYS = 7;
const SESSION_KEY_STORAGE_KEY = "local_auth_session_key";
const SESSION_KEY_BYTE_LENGTH = 32;

function generate_random_session_key(): string {
  const random_bytes = crypto.getRandomValues(
    new Uint8Array(SESSION_KEY_BYTE_LENGTH),
  );
  return Array.from(random_bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function get_or_create_browser_session_key(): string {
  const existing_key = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
  if (existing_key) return existing_key;
  const new_key = generate_random_session_key();
  sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, new_key);
  return new_key;
}

function is_real_browser_environment(): boolean {
  return browser && typeof sessionStorage !== "undefined";
}

function get_secret_key(): string {
  if (is_real_browser_environment()) {
    return get_or_create_browser_session_key();
  }
  const server_secret_key = process.env.AUTH_SECRET_KEY;
  if (!server_secret_key) {
    throw new Error(
      "AUTH_SECRET_KEY environment variable is required but not set",
    );
  }
  return server_secret_key;
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
    payload_input: Omit<AuthTokenPayload, "issued_at" | "expires_at">,
  ): Promise<Result<AuthToken>> {
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
        get_secret_key(),
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
      return create_failure_result(`Failed to generate token: ${error}`);
    }
  }

  async verify_token(
    raw_token: string,
  ): Promise<Result<AuthVerificationResult>> {
    if (!raw_token || raw_token.trim().length === 0) {
      return create_success_result({
        is_valid: false,
        error_message: "Token is empty",
      });
    }
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
    const is_signature_valid = await verify_hmac_signature(
      `${header}.${encoded_payload}`,
      signature,
      get_secret_key(),
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
      return create_success_result(
        JSON.parse(base64_url_decode(parts[1])) as AuthTokenPayload,
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

let authentication_adapter_instance: LocalAuthenticationAdapter | null = null;

export function get_authentication_adapter(
  system_user_repository: InBrowserSystemUserRepository,
): LocalAuthenticationAdapter {
  if (!authentication_adapter_instance) {
    authentication_adapter_instance = new LocalAuthenticationAdapter(
      system_user_repository,
    );
  }
  return authentication_adapter_instance;
}
