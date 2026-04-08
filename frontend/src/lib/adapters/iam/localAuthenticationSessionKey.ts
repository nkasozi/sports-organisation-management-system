import { browser } from "$app/environment";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

const SESSION_KEY_STORAGE_KEY = "local_auth_session_key";
const SESSION_KEY_BYTE_LENGTH = 32;

function generate_random_session_key(): string {
  const random_bytes = crypto.getRandomValues(
    new Uint8Array(SESSION_KEY_BYTE_LENGTH),
  );
  return Array.from(random_bytes, (byte: number) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function get_or_create_browser_session_key(): string {
  const existing_key = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
  if (existing_key) {
    return existing_key;
  }
  const new_key = generate_random_session_key();
  sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, new_key);
  return new_key;
}

function is_real_browser_environment(): boolean {
  return browser && typeof sessionStorage !== "undefined";
}

export function get_local_auth_secret_key(): Result<string> {
  if (is_real_browser_environment()) {
    return create_success_result(get_or_create_browser_session_key());
  }
  const server_secret_key = process.env.AUTH_SECRET_KEY;
  if (!server_secret_key) {
    console.error("[Auth] Missing AUTH_SECRET_KEY environment variable", {
      event: "auth_secret_key_missing",
    });
    return create_failure_result(
      "AUTH_SECRET_KEY environment variable is required but not set",
    );
  }
  return create_success_result(server_secret_key);
}
