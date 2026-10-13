import type {
  AuthenticationPort,
  AuthToken,
  AuthTokenPayloadCore,
  AuthVerificationResult,
} from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  type AuthCache,
  create_auth_cache,
} from "$lib/infrastructure/cache/AuthCache";
import { CACHE_LOOKUP_STATUS } from "$lib/infrastructure/cache/authCacheConstants";

import {
  build_auth_token_payload,
  build_invalid_verification_result,
  build_valid_verification_result,
  type ClerkSessionProvider,
  create_clerk_session_provider,
} from "./clerkAuthenticationHelpers";
import { IAM_LOG_EVENT, IAM_MESSAGE, SINGLETON_STATUS } from "./iamConstants";

export type { ClerkSessionProvider } from "./clerkAuthenticationHelpers";

const CLERK_VERIFICATION_CACHE_MAX_ENTRIES = 50;
const CLERK_VERIFICATION_CACHE_TTL_MS = 30 * 60 * 1000;
const CLERK_MANAGED_SIGNATURE = "clerk-managed";

export class ClerkAuthenticationAdapter implements AuthenticationPort {
  private session_provider: ClerkSessionProvider;
  private verification_cache: AuthCache<AuthVerificationResult>;

  constructor(
    session_provider: ClerkSessionProvider,
    verification_cache?: AuthCache<AuthVerificationResult>,
  ) {
    this.session_provider = session_provider;
    this.verification_cache =
      verification_cache ??
      create_auth_cache<AuthVerificationResult>({
        max_entries: CLERK_VERIFICATION_CACHE_MAX_ENTRIES,
        fallback_ttl_ms: CLERK_VERIFICATION_CACHE_TTL_MS,
      });
  }

  get_verification_cache(): AuthCache<AuthVerificationResult> {
    return this.verification_cache;
  }

  async generate_token(
    payload_input: AuthTokenPayloadCore,
  ): Promise<Result<AuthToken>> {
    const session_token_result =
      await this.session_provider.get_session_token();
    if (!session_token_result.success) {
      return create_failure_result(session_token_result.error);
    }
    const payload = build_auth_token_payload(payload_input);
    console.log("[ClerkAuthenticationAdapter] Generated token", {
      event: IAM_LOG_EVENT.CLERK_TOKEN_GENERATED,
      user_id: payload.user_id,
      role: payload.role,
    });
    return create_success_result({
      payload,
      signature: CLERK_MANAGED_SIGNATURE,
      raw_token: session_token_result.data,
    });
  }

  async verify_token(
    raw_token: string,
  ): Promise<Result<AuthVerificationResult>> {
    const cached = this.verification_cache.lookup(raw_token);
    if (cached.status === CACHE_LOOKUP_STATUS.HIT) {
      console.log("[ClerkAuthenticationAdapter] Verification cache hit", {
        event: IAM_LOG_EVENT.CLERK_TOKEN_CACHE_HIT,
      });
      return create_success_result(cached.value);
    }
    const result = this.verify_token_via_clerk_session();
    if (result.is_valid) {
      this.verification_cache.set(raw_token, result);
    }
    return create_success_result(result);
  }

  private verify_token_via_clerk_session(): AuthVerificationResult {
    if (!this.session_provider.is_signed_in()) {
      console.log("[ClerkAuthenticationAdapter] No active session", {
        event: IAM_LOG_EVENT.CLERK_NO_ACTIVE_SESSION,
      });
      return build_invalid_verification_result(
        IAM_MESSAGE.NO_ACTIVE_CLERK_SESSION,
      );
    }
    const clerk_user_result = this.session_provider.get_current_user();
    if (!clerk_user_result.success) {
      console.warn("[ClerkAuthenticationAdapter] Session has no user", {
        event: IAM_LOG_EVENT.CLERK_USER_UNAVAILABLE,
      });
      return build_invalid_verification_result(
        IAM_MESSAGE.CLERK_USER_UNAVAILABLE,
      );
    }
    const clerk_user = clerk_user_result.data;
    console.log("[ClerkAuthenticationAdapter] Verified token", {
      event: IAM_LOG_EVENT.CLERK_TOKEN_VERIFIED,
      user_id: clerk_user.id,
    });
    return build_valid_verification_result(clerk_user);
  }
}

type ClerkAuthenticationAdapterState =
  | { status: typeof SINGLETON_STATUS.UNINITIALIZED }
  | {
      status: typeof SINGLETON_STATUS.READY;
      adapter: ClerkAuthenticationAdapter;
    };

let clerk_authentication_adapter_state: ClerkAuthenticationAdapterState = {
  status: SINGLETON_STATUS.UNINITIALIZED,
};

export function get_clerk_authentication_adapter(): ClerkAuthenticationAdapter {
  if (clerk_authentication_adapter_state.status === SINGLETON_STATUS.READY) {
    return clerk_authentication_adapter_state.adapter;
  }

  const adapter = new ClerkAuthenticationAdapter(
    create_clerk_session_provider(),
  );
  clerk_authentication_adapter_state = {
    status: SINGLETON_STATUS.READY,
    adapter,
  };

  return adapter;
}
