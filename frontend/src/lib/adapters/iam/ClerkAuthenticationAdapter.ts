import type {
  AuthenticationPort,
  AuthToken,
  AuthTokenPayload,
  AuthVerificationResult,
} from "$lib/core/interfaces/ports";
import {
  create_auth_cache,
  type AuthCache,
} from "$lib/infrastructure/cache/AuthCache";
import type { Result } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";

const CLERK_VERIFICATION_CACHE_MAX_ENTRIES = 50;
const CLERK_VERIFICATION_CACHE_TTL_MS = 30 * 60 * 1000;
const TOKEN_EXPIRY_SECONDS = 365 * 24 * 60 * 60;

export interface ClerkUserInfo {
  id: string;
  email_address: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
}

export interface ClerkSessionProvider {
  get_session_token(): Promise<string | null>;
  get_current_user(): ClerkUserInfo | null;
  is_signed_in(): boolean;
}

function build_auth_token_payload(
  input: Omit<AuthTokenPayload, "issued_at" | "expires_at">,
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
): AuthTokenPayload {
  const now_in_seconds = Math.floor(Date.now() / 1000);
  return {
    user_id: clerk_user.id,
    email: clerk_user.email_address,
    display_name:
      clerk_user.full_name ||
      `${clerk_user.first_name} ${clerk_user.last_name}`.trim(),
    organization_id: "*",
    team_id: "*",
    issued_at: now_in_seconds,
    expires_at: now_in_seconds + TOKEN_EXPIRY_SECONDS,
  };
}

function build_invalid_verification_result(
  error_message: string,
): AuthVerificationResult {
  return {
    is_valid: false,
    error_message,
  };
}

function build_valid_verification_result(
  clerk_user: ClerkUserInfo,
): AuthVerificationResult {
  return {
    is_valid: true,
    payload: build_verification_payload_from_clerk_user(clerk_user),
  };
}

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
    payload_input: Omit<AuthTokenPayload, "issued_at" | "expires_at">,
  ): Promise<Result<AuthToken>> {
    const session_token = await this.session_provider.get_session_token();

    if (!session_token) {
      return create_failure_result(
        "No active Clerk session - cannot generate token",
      );
    }

    const payload = build_auth_token_payload(payload_input);

    console.log(
      `[ClerkAuthenticationAdapter] Generated token for user: ${payload.email}`,
    );

    return create_success_result({
      payload,
      signature: "clerk-managed",
      raw_token: session_token,
    });
  }

  async verify_token(
    raw_token: string,
  ): Promise<Result<AuthVerificationResult>> {
    const cached = this.verification_cache.get_or_miss(raw_token);

    if (cached.is_hit && cached.value) {
      console.log(
        "[ClerkAuthenticationAdapter] Cache HIT for token verification",
      );
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
      console.log(
        "[ClerkAuthenticationAdapter] No active Clerk session for verification",
      );
      return build_invalid_verification_result(
        "No active Clerk session - user is not signed in",
      );
    }

    const clerk_user = this.session_provider.get_current_user();

    if (!clerk_user) {
      console.log(
        "[ClerkAuthenticationAdapter] Clerk session active but no user data available",
      );
      return build_invalid_verification_result(
        "Clerk session exists but user data is unavailable",
      );
    }

    console.log(
      `[ClerkAuthenticationAdapter] Verified token for user: ${clerk_user.email_address}`,
    );

    return build_valid_verification_result(clerk_user);
  }
}

import { get } from "svelte/store";
import {
  get_session_token,
  clerk_session,
  type ClerkUser as ClerkServiceUser,
} from "./clerkAuthService";

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

function create_clerk_session_provider(): ClerkSessionProvider {
  return {
    get_session_token,
    get_current_user(): ClerkUserInfo | null {
      const session_state = get(clerk_session);
      if (!session_state.user) return null;
      return map_clerk_service_user_to_clerk_user_info(session_state.user);
    },
    is_signed_in(): boolean {
      const session_state = get(clerk_session);
      return session_state.is_signed_in;
    },
  };
}

let clerk_authentication_adapter_instance: ClerkAuthenticationAdapter | null =
  null;

export function get_clerk_authentication_adapter(): ClerkAuthenticationAdapter {
  if (!clerk_authentication_adapter_instance) {
    const session_provider = create_clerk_session_provider();
    clerk_authentication_adapter_instance = new ClerkAuthenticationAdapter(
      session_provider,
    );
  }
  return clerk_authentication_adapter_instance;
}
