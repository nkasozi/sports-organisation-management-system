export const TOKEN_PART_COUNT = 3;
export const TOKEN_PART_SEPARATOR = ".";

export const LOCAL_TOKEN_MESSAGE = {
  EMPTY: "Token is empty",
  PAYLOAD_INVALID: "Token payload is invalid",
  FORMAT_INVALID_PARTS: "Token format is invalid (expected 3 parts)",
  FORMAT_INVALID: "Invalid token format",
  DECODE_FAILED: "Failed to decode token payload",
  TAMPERED: "Token has been tampered with",
  EXPIRED: "Token has expired",
  USER_NOT_FOUND: "User not found",
  GENERATION_FAILED: "Failed to generate token",
  VERIFICATION_UNAVAILABLE:
    "We could not verify your session right now. Please try again.",
  SECRET_KEY_MISSING:
    "AUTH_SECRET_KEY environment variable is required but not set",
} as const;

export const LOCAL_TOKEN_LOG_EVENT = {
  DECODE_FAILED: "token_decode_failed",
  TAMPERED: "token_tampered",
  EXPIRED: "token_expired",
  GENERATED: "token_generated",
  GENERATION_FAILED: "token_generation_failed",
  CACHE_HIT: "token_cache_hit",
  VERIFIED: "token_verified",
  USER_NOT_FOUND: "token_user_not_found",
  USER_LOOKUP_FAILED: "token_user_lookup_failed",
  SECRET_KEY_MISSING: "auth_secret_key_missing",
  SESSION_KEY_STORAGE_FAILED: "local_auth_session_key_storage_failed",
} as const;

export const SESSION_KEY_STORAGE_KEY = "local_auth_session_key";
