export const LIVE_GAMES_USER_MESSAGE = {
  ORGANIZATIONS_LOAD_FAILED:
    "We couldn't load your organizations. Please refresh the page to try again.",
  FIXTURES_LOAD_FAILED:
    "We couldn't load today's games. Please refresh the page to try again.",
  NO_USER_PROFILE_FOUND: "No user profile found",
  PERMISSION_CHECK_FAILED:
    "We couldn't confirm your access to live games. Please refresh the page to try again.",
} as const;

export const LIVE_GAMES_DATA_EVENT = {
  ORGANIZATIONS_LOAD_FAILED: "live_games_organizations_load_failed",
  FIXTURES_LOAD_FAILED: "live_games_fixtures_load_failed",
} as const;

export const LIVE_GAMES_FALLBACK_LABEL = {
  UNKNOWN_TEAM: "Unknown Team",
  UNKNOWN_COMPETITION: "Unknown Competition",
  UNKNOWN_SPORT: "Unknown Sport",
} as const;
