import { browser } from "$app/environment";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  LOCAL_TOKEN_LOG_EVENT,
  LOCAL_TOKEN_MESSAGE,
  SESSION_KEY_STORAGE_KEY,
} from "./localAuthenticationTokenConstants";

const SESSION_KEY_BYTE_LENGTH = 32;
const HEX_RADIX = 16;
const HEX_BYTE_WIDTH = 2;
const HEX_PAD_CHARACTER = "0";

function generate_random_session_key(): string {
  const random_bytes = crypto.getRandomValues(
    new Uint8Array(SESSION_KEY_BYTE_LENGTH),
  );
  return Array.from(random_bytes, (byte: number) =>
    byte.toString(HEX_RADIX).padStart(HEX_BYTE_WIDTH, HEX_PAD_CHARACTER),
  ).join("");
}

function get_or_create_browser_session_key(): Result<string> {
  try {
    const existing_key = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
    if (existing_key) return create_success_result(existing_key);
    const new_key = generate_random_session_key();
    sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, new_key);
    return create_success_result(new_key);
  } catch (error) {
    console.error("[Auth] Failed to access the local session key", {
      event: LOCAL_TOKEN_LOG_EVENT.SESSION_KEY_STORAGE_FAILED,
      error: String(error),
    });
    return create_failure_result(LOCAL_TOKEN_MESSAGE.VERIFICATION_UNAVAILABLE);
  }
}

function is_real_browser_environment(): boolean {
  return browser && Boolean(globalThis.sessionStorage);
}

export function get_local_auth_secret_key(): Result<string> {
  if (is_real_browser_environment()) {
    return get_or_create_browser_session_key();
  }
  const server_secret_key = process.env.AUTH_SECRET_KEY;
  if (!server_secret_key) {
    console.error("[Auth] Missing AUTH_SECRET_KEY environment variable", {
      event: LOCAL_TOKEN_LOG_EVENT.SECRET_KEY_MISSING,
    });
    return create_failure_result(LOCAL_TOKEN_MESSAGE.SECRET_KEY_MISSING);
  }
  return create_success_result(server_secret_key);
}
