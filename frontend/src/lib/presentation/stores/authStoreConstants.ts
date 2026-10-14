import type { UserRole } from "$lib/core/interfaces/ports";

export const PROFILE_MATCH_STATUS = {
  FOUND: "found",
  MISSING: "missing",
} as const;

export const SESSION_RESTORE_STATUS = {
  RESTORED: "restored",
  NOT_RESTORED: "not_restored",
} as const;

export const SAVED_TOKEN_VERIFICATION_STATUS = {
  VERIFIED: "verified",
  INVALID: "invalid",
} as const;

export const EVENT_BUS_USER_CONTEXT_STATUS = {
  CLEARED: "cleared",
  PRESENT: "present",
} as const;

export const PUBLIC_VIEWER_PROFILE_ID = "public-viewer";
export const PUBLIC_VIEWER_ROLE = "public_viewer" satisfies UserRole;
export const PUBLIC_VIEWER_DISPLAY_NAME = "Public Viewer";
export const PUBLIC_VIEWER_TOKEN_EMAIL = "public-viewer@anonymous.invalid";

export const CONVEX_CURRENT_USER_PROFILE_QUERY =
  "authorization:get_current_user_profile";
export const AUTH_TOKEN_SEGMENT_SEPARATOR = ".";
export const AUTH_TOKEN_SIGNATURE_SEGMENT_INDEX = 2;

export const AUTH_STORE_MESSAGES = {
  CONVEX_PROFILE_NOT_FOUND: "Profile not found in Convex",
  CONVEX_PROFILE_LOOKUP_FAILED:
    "Your profile could not be loaded right now. Please try again.",
  SIGNED_IN_PROFILE_NOT_FOUND:
    "no local profile found for the signed-in Clerk account — user may not be registered",
} as const;

export const AUTH_STORE_LOG_EVENTS = {
  CONVEX_PROFILE_QUERY_FAILED: "auth_convex_profile_query_failed",
  TOKEN_GENERATION_FAILED: "auth_token_generation_failed",
  SIDEBAR_MENU_LOAD_FAILED: "auth_sidebar_menu_load_failed",
  SWITCHED_PROFILE_RESTORED: "auth_switched_profile_restored",
  SAVED_TOKEN_INVALID_ON_ANONYMOUS_RESTORE:
    "auth_saved_token_invalid_on_anonymous_restore",
  SAVED_TOKEN_PROFILE_MISSING_ON_ANONYMOUS_RESTORE:
    "auth_saved_token_profile_missing_on_anonymous_restore",
  WAITING_FOR_CLERK: "auth_waiting_for_clerk",
  PUBLIC_VIEWER_PROFILE_MISSING: "auth_public_viewer_profile_missing",
  DEFAULTED_TO_PUBLIC_VIEWER: "auth_defaulted_to_public_viewer",
  LOCAL_PROFILE_NOT_FOUND: "auth_local_profile_not_found",
  INITIALIZED_FROM_CLERK_EMAIL: "auth_initialized_from_clerk_email",
  PROFILE_REFRESH_STARTED: "auth_profile_refresh_started",
  PROFILES_REFRESHED: "auth_profiles_refreshed",
  PROFILE_SWITCHED: "auth_profile_switched",
  PROFILE_SWITCH_TARGET_MISSING: "auth_profile_switch_target_missing",
  PROFILE_SWITCH_REJECTED: "auth_profile_switch_rejected",
  PROFILE_SWITCH_FAILED: "auth_profile_switch_failed",
  LOGGED_OUT: "auth_logged_out",
  SAVED_TOKEN_OWNER_MISMATCH: "auth_saved_token_owner_mismatch",
  SAVED_TOKEN_REJECTED: "auth_saved_token_rejected",
  SIGNED_IN_SESSION_RESTORED: "auth_signed_in_session_restored",
} as const;
