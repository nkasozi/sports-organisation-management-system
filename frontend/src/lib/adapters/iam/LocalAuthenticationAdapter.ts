import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type {
  AuthenticationPort,
  AuthToken,
  AuthTokenPayload,
  AuthTokenPayloadCore,
  AuthVerificationResult,
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
import { CACHE_LOOKUP_STATUS } from "$lib/infrastructure/cache/authCacheConstants";

import { SINGLETON_STATUS } from "./iamConstants";
import {
  LOCAL_TOKEN_LOG_EVENT,
  LOCAL_TOKEN_MESSAGE,
} from "./localAuthenticationTokenConstants";
import { issue_local_auth_token } from "./localAuthenticationTokenIssuer";
import {
  is_public_viewer_token_payload,
  verify_signed_token_payload,
} from "./localAuthenticationTokenPayload";

const VERIFICATION_CACHE_MAX_ENTRIES = 50;
const VERIFICATION_CACHE_TTL_MS = 30 * 60 * 1000;

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
    return issue_local_auth_token(payload_input, Date.now());
  }

  async verify_token(
    raw_token: string,
  ): Promise<Result<AuthVerificationResult>> {
    if (!raw_token || raw_token.trim().length === 0)
      return create_success_result({
        is_valid: false,
        error_message: LOCAL_TOKEN_MESSAGE.EMPTY,
      });
    const cached_result = this.verification_cache.lookup(raw_token);
    if (cached_result.status === CACHE_LOOKUP_STATUS.HIT) {
      console.log("[Auth] Cache HIT for token verification", {
        event: LOCAL_TOKEN_LOG_EVENT.CACHE_HIT,
      });
      return create_success_result(cached_result.value);
    }
    const verification_result =
      await this.verify_token_without_cache(raw_token);
    if (verification_result.success && verification_result.data.is_valid) {
      this.verification_cache.set(raw_token, verification_result.data);
    }
    return verification_result;
  }

  private async verify_token_without_cache(
    raw_token: string,
  ): Promise<Result<AuthVerificationResult>> {
    const payload_result = await verify_signed_token_payload(raw_token);
    if (!payload_result.success)
      return create_success_result({
        is_valid: false,
        error_message: payload_result.error,
      });
    const payload = payload_result.data;
    if (!is_public_viewer_token_payload(payload))
      return this.verify_token_user(payload);
    console.log("[Auth] Token verified", {
      event: LOCAL_TOKEN_LOG_EVENT.VERIFIED,
      user_id: payload.user_id,
      role: payload.role,
    });
    return create_success_result({ is_valid: true, payload });
  }

  private async verify_token_user(
    payload: AuthTokenPayload,
  ): Promise<Result<AuthVerificationResult>> {
    const user_result = await this.system_user_repository.find_by_email(
      payload.email,
    );
    if (!user_result.success) {
      console.error("[Auth] Token user lookup failed", {
        event: LOCAL_TOKEN_LOG_EVENT.USER_LOOKUP_FAILED,
        user_id: payload.user_id,
        error: user_result.error,
      });
      return create_failure_result(
        LOCAL_TOKEN_MESSAGE.VERIFICATION_UNAVAILABLE,
      );
    }
    if (user_result.data.items.length === 0) {
      console.warn("[Auth] User not found for token", {
        event: LOCAL_TOKEN_LOG_EVENT.USER_NOT_FOUND,
        user_id: payload.user_id,
      });
      return create_success_result({
        is_valid: false,
        error_message: LOCAL_TOKEN_MESSAGE.USER_NOT_FOUND,
      });
    }
    const system_user = user_result.data.items[0];
    console.log("[Auth] Token verified", {
      event: LOCAL_TOKEN_LOG_EVENT.VERIFIED,
      user_id: system_user.id,
    });
    return create_success_result({ is_valid: true, payload, system_user });
  }
}

type AuthenticationAdapterState =
  | { status: typeof SINGLETON_STATUS.UNINITIALIZED }
  | {
      status: typeof SINGLETON_STATUS.READY;
      adapter: LocalAuthenticationAdapter;
    };

let authentication_adapter_state: AuthenticationAdapterState = {
  status: SINGLETON_STATUS.UNINITIALIZED,
};

export function get_authentication_adapter(
  system_user_repository: InBrowserSystemUserRepository,
): LocalAuthenticationAdapter {
  if (authentication_adapter_state.status === SINGLETON_STATUS.READY) {
    return authentication_adapter_state.adapter;
  }

  const adapter = new LocalAuthenticationAdapter(system_user_repository);
  authentication_adapter_state = { status: SINGLETON_STATUS.READY, adapter };

  return adapter;
}
