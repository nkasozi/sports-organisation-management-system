export const AUTH_GUARD_EVENTS = {
  AUTH_INITIALIZATION_STARTED: "auth_guard_initialization_started",
  AUTH_INITIALIZATION_FAILED: "auth_guard_initialization_failed",
  AUTH_PROFILE_MISSING: "auth_guard_profile_missing",
  ROUTE_ACCESS_LOAD_FAILED: "auth_guard_route_access_load_failed",
  ROUTE_ACCESS_LOADED: "auth_guard_route_access_loaded",
} as const;

export const AUTH_GUARD_MESSAGES = {
  PROFILE_REQUIRED: "Please select a user profile to access this page.",
  PROFILE_REQUIRED_FOR_DATA:
    "Unable to load data: No user profile is set. Please select a user profile to continue.",
  SESSION_UNAVAILABLE:
    "We couldn't load your session. Please refresh the page and try again.",
  ROUTE_ACCESS_UNAVAILABLE:
    "We couldn't verify your access to this page right now. Please try again.",
} as const;

export const ROOT_ROUTE_PATH = "/";
export const EMPTY_ROUTE_PATH = "";
export const DASHBOARD_PAGE_NAME = "Dashboard";

export const ROUTE_ACCESS_CACHE_STATUS = {
  EMPTY: "empty",
  READY: "ready",
  LOAD_FAILED: "load_failed",
} as const;
