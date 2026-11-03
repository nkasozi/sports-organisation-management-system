import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";
import { base64_url_decode } from "$lib/infrastructure/utils/JwtTokenUtils";

const CACHED_TOKEN_SETTING_KEY = "clerk_convex_session_token";
const TOKEN_SEGMENT_SEPARATOR = ".";
const TOKEN_PAYLOAD_SEGMENT_INDEX = 1;
const MILLISECONDS_PER_SECOND = 1000;
const EXPIRY_SAFETY_MARGIN_MS = 60_000;
const NUMBER_TYPE_NAME = "number";
const STRING_TYPE_NAME = "string";

const CACHED_TOKEN_EVENTS = {
  REUSED: "clerk_cached_token_reused",
  REFRESHED: "clerk_cached_token_refreshed",
  READ_FAILED: "clerk_cached_token_read_failed",
  UNREADABLE: "clerk_cached_token_unreadable",
  SAVE_FAILED: "clerk_cached_token_save_failed",
  CLEARED: "clerk_cached_token_cleared",
  CLEAR_FAILED: "clerk_cached_token_clear_failed",
} as const;

export interface CachedSessionTokenDependencies {
  storage: AppSettingsPort;
  now_ms(): number;
  current_session_id: Option<string>;
  request_fresh_token(): Promise<Result<string>>;
}

interface SessionTokenRequest {
  force_refresh: boolean;
}

interface TokenClaims {
  session_id: string;
  expires_at_ms: number;
}

function read_token_claims(token: string): Option<TokenClaims> {
  try {
    const claims = JSON.parse(
      base64_url_decode(
        token.split(TOKEN_SEGMENT_SEPARATOR)[TOKEN_PAYLOAD_SEGMENT_INDEX],
      ),
    ) as Record<string, unknown>;
    if (
      typeof claims.exp !== NUMBER_TYPE_NAME ||
      typeof claims.sid !== STRING_TYPE_NAME
    )
      return create_none_option();
    return create_some_option({
      session_id: claims.sid as string,
      expires_at_ms: (claims.exp as number) * MILLISECONDS_PER_SECOND,
    });
  } catch (error) {
    console.warn("[Clerk] Saved session token is unreadable", {
      event: CACHED_TOKEN_EVENTS.UNREADABLE,
      error: String(error),
    });
    return create_none_option();
  }
}

function is_usable_token(
  token: string,
  dependencies: CachedSessionTokenDependencies,
): boolean {
  const claims = read_token_claims(token);
  if (claims.status !== OptionStatus.SOME) return false;
  const is_current_session =
    dependencies.current_session_id.status !== OptionStatus.SOME ||
    dependencies.current_session_id.value === claims.value.session_id;
  return (
    is_current_session &&
    claims.value.expires_at_ms - EXPIRY_SAFETY_MARGIN_MS > dependencies.now_ms()
  );
}

async function read_saved_token(storage: AppSettingsPort): Promise<string> {
  try {
    return await storage.get_setting(CACHED_TOKEN_SETTING_KEY);
  } catch (error) {
    console.warn("[Clerk] Saved session token could not be read", {
      event: CACHED_TOKEN_EVENTS.READ_FAILED,
      error: String(error),
    });
    return "";
  }
}

async function save_token(
  storage: AppSettingsPort,
  token: string,
): Promise<boolean> {
  try {
    await storage.set_setting(CACHED_TOKEN_SETTING_KEY, token);
    return true;
  } catch (error) {
    console.warn("[Clerk] Session token could not be saved", {
      event: CACHED_TOKEN_EVENTS.SAVE_FAILED,
      error: String(error),
    });
    return false;
  }
}

export async function get_cached_or_fresh_session_token(
  dependencies: CachedSessionTokenDependencies,
  request: SessionTokenRequest,
): Promise<Result<string>> {
  const saved_token = request.force_refresh
    ? ""
    : await read_saved_token(dependencies.storage);
  if (saved_token && is_usable_token(saved_token, dependencies)) {
    console.log("[Clerk] Using saved session token", {
      event: CACHED_TOKEN_EVENTS.REUSED,
    });
    return { success: true, data: saved_token };
  }
  const fresh_token = await dependencies.request_fresh_token();
  if (!fresh_token.success) return fresh_token;
  await save_token(dependencies.storage, fresh_token.data);
  console.log("[Clerk] Saved a fresh session token", {
    event: CACHED_TOKEN_EVENTS.REFRESHED,
    force_refresh: request.force_refresh,
  });
  return fresh_token;
}

export async function clear_cached_session_token(
  storage: AppSettingsPort,
): Promise<boolean> {
  try {
    await storage.remove_setting(CACHED_TOKEN_SETTING_KEY);
  } catch (error) {
    console.warn("[Clerk] Saved session token could not be cleared", {
      event: CACHED_TOKEN_EVENTS.CLEAR_FAILED,
      error: String(error),
    });
    return false;
  }
  console.log("[Clerk] Saved session token cleared", {
    event: CACHED_TOKEN_EVENTS.CLEARED,
  });
  return true;
}
