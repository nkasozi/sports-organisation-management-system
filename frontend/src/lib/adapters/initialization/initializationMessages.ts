export const INITIALIZATION_ERROR_MESSAGE = {
  CONVEX_URL_MISSING: "Server connection is not configured",
  CONVEX_CLIENT_FAILED: "Unable to connect to the server right now",
  NOT_IN_BROWSER: "Not in browser environment",
  SEEDING_STATE_UNREADABLE:
    "We could not check this device's saved data. Please reload and try again.",
  LOCAL_SEEDING_FAILED: "Unable to prepare offline data on this device",
  CONVEX_AND_LOCAL_FAILED:
    "Unable to load data from the server or from this device. Please try again.",
  OFFLINE_MODE:
    "Unable to fetch the latest data from the server. Using previously saved data.",
  CONVEX_REQUIRED:
    "Unable to connect to the server to load your data. Please check your internet connection and try again.",
  NO_CLERK_SESSION: "No Clerk session active",
  CLERK_EMAIL_INVALID: "Your sign-in email address is invalid",
  SYSTEM_USER_LOOKUP_FAILED: "Failed to load your user account",
  SYSTEM_USER_NOT_FOUND:
    "Your user account is not available on this device yet",
  SET_CURRENT_USER_FAILED: "Failed to load your user account",
  SUPER_ADMIN_SEED_FAILED: "Failed to seed super admin user",
  VENUE_IDS_INCOMPLETE: "Failed to seed demo venues",
  SEED_LOOKUPS_FAILED: "Failed to load demo reference data",
} as const;

export const INITIALIZATION_PROGRESS_MESSAGE = {
  LOADING_OFFLINE_DATA: "Loading offline data...",
  OFFLINE_DATA_READY: "Offline data ready",
  CONNECTING_TO_SERVER: "Connecting to server...",
  SERVER_UNAVAILABLE_LOADING_DEMO: "Server unavailable, loading demo data...",
  PULLING_DATA_FROM_SERVER: "Pulling data from server...",
  CHECKING_SERVER: "Checking server for existing data...",
  SERVER_DATA_LOADED: "Server data loaded successfully",
  DATA_LOADED_FROM_SERVER: "Data loaded from server",
  DEMO_DATA_LOADED_OFFLINE: "Demo data loaded (offline mode)",
  FINALIZING_SETUP: "Finalizing setup...",
  PREPARING_PUBLIC_VIEW: "Preparing public view...",
} as const;

export const INITIALIZATION_PROGRESS_PERCENT = {
  CONVEX_CONNECTING: 15,
  LOCAL_ONLY_STARTED: 20,
  FIRST_TIME_CONNECTING: 30,
  LOCAL_FALLBACK_STARTED: 40,
  CONVEX_LOADED: 85,
  DATA_READY: 90,
  FINALIZING: 95,
  ERROR: 0,
} as const;
