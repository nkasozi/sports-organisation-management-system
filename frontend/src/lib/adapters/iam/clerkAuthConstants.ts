export const CONVEX_TOKEN_TEMPLATE = "convex";

export const CLERK_MESSAGE = {
  NOT_INITIALIZED: "Clerk not initialized",
  NO_SESSION: "No Clerk session available",
  TOKEN_UNAVAILABLE: "Clerk session token unavailable",
  TOKEN_REQUEST_FAILED: "Failed to get Clerk session token",
  LOAD_TIMED_OUT: "ClerkProvider did not load Clerk in time",
  SIGN_OUT_FAILED: "We could not sign you out. Please try again.",
} as const;

export const CLERK_LOG_EVENT = {
  INITIALIZATION_SKIPPED: "clerk_initialization_skipped",
  ALREADY_INITIALIZED: "clerk_already_initialized",
  INITIALIZED: "clerk_initialized",
  INITIALIZATION_FAILED: "clerk_initialization_failed",
  LOAD_TIMED_OUT: "clerk_load_timed_out",
  LOAD_INCOMPLETE: "clerk_load_incomplete",
  SESSION_PENDING: "clerk_session_pending",
  SESSION_READY: "clerk_session_ready",
  SESSION_PENDING_TIMED_OUT: "clerk_session_pending_timed_out",
  TOKEN_NO_SESSION: "clerk_token_no_session",
  TOKEN_EMPTY: "clerk_token_empty",
  TOKEN_REQUEST_FAILED: "clerk_token_request_failed",
  SIGN_OUT_REJECTED: "clerk_sign_out_rejected",
  SIGN_OUT_FAILED: "clerk_sign_out_failed",
  SIGNED_OUT: "clerk_signed_out",
} as const;

export const CLERK_ERROR_CODE = {
  NOT_IN_BROWSER: "clerk_not_in_browser",
  PUBLISHABLE_KEY_MISSING: "clerk_publishable_key_missing",
  LOAD_TIMED_OUT: "clerk_load_timed_out",
  INITIALIZATION_THREW: "clerk_initialization_threw",
} as const;

export type ClerkErrorCode =
  (typeof CLERK_ERROR_CODE)[keyof typeof CLERK_ERROR_CODE];
