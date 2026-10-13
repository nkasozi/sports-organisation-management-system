export const LAYOUT_SESSION_EVENT = {
  LOGIN_SYNC_FAILED: "login_sync_failed",
  LOGIN_SYNC_COMPLETE: "verified_user_login_sync_complete",
  LOGIN_SYNC_DUPLICATE_SKIPPED: "sync_duplicate_skipped",
  LOGIN_SYNC_BLOCKED_UNSYNCED_CHANGES: "login_sync_blocked_unsynced_changes",
  LOGIN_PROFILE_NOT_FOUND: "login_profile_not_found",
  FAILED_LOGIN_TEARDOWN_FAILED: "failed_login_teardown_failed",
  ANONYMOUS_FIRST_TIME_RESET_BLOCKED: "anonymous_first_time_reset_blocked",
  ANONYMOUS_BLOCKED_RESET_RETURNING_SESSION_FAILED:
    "anonymous_blocked_reset_returning_session_failed",
  ANONYMOUS_FIRST_TIME_SETUP_COMPLETE: "anonymous_first_time_setup_complete",
  ANONYMOUS_RETURNING_SESSION_RESTORED: "anonymous_returning_session_restored",
  VERIFIED_USER_PAGE_RELOAD_COMPLETE: "verified_user_page_reload_complete",
} as const;

export const LAYOUT_SESSION_PROGRESS = {
  LOADING_OFFLINE_DATA: { message: "Loading offline data...", percentage: 20 },
  SETTING_UP_PROFILE: { message: "Setting up your profile...", percentage: 85 },
  STOPPING_BACKGROUND: {
    message: "Stopping background processes...",
    percentage: 5,
  },
  LOOKING_UP_PROFILE: { message: "Looking up your profile...", percentage: 8 },
  PREPARING_WORKSPACE: {
    message: "Profile found. Preparing your workspace...",
    percentage: 9,
  },
  CLEARING_LOCAL_DATA: { message: "Clearing local data...", percentage: 10 },
  SETTING_UP_ACCOUNT: { message: "Setting up your account...", percentage: 17 },
  LOADING_ORGANIZATION: {
    message: "Loading your organisation...",
    percentage: 18,
  },
  LOADING_TEAM: { message: "Loading your team...", percentage: 19 },
  STARTING_DATA_SYNC: { message: "Starting data sync...", percentage: 20 },
  RESOLVING_REFERENCES: { message: "Resolving references...", percentage: 88 },
  ALMOST_READY: { message: "Almost ready...", percentage: 92 },
  LOADING_PROFILE: { message: "Loading your profile...", percentage: 96 },
} as const;

export const LAYOUT_SESSION_MESSAGE = {
  FIRST_TIME_RESET_BLOCKED:
    "Local data reset skipped to protect unsynced local changes",
  LOGIN_BLOCKED:
    "Sign-in stopped to protect local changes that have not been synced",
  NO_PROFILE_FOUND: "No profile found for this account.",
  SYNC_FAILED_PREFIX: "Sync failed:",
  UNKNOWN_SYNC_ERROR: "Unknown sync error",
} as const;
