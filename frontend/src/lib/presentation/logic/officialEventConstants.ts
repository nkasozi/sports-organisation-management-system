export const OFFICIAL_EVENT = {
  FIXTURE_USE_CASES_MISSING: "officials_from_fixture_missing_use_cases",
  FIXTURE_NOT_FOUND: "fixture_not_found_for_officials",
  FIXTURES_LOADED: "fixtures_loaded_for_official",
  OFFICIALS_LOADED: "officials_loaded_for_fixture",
  LEADERBOARD_LOAD_FAILED: "official_leaderboard_load_failed",
  LEADERBOARD_ENTRY_SELECTED: "official_leaderboard_entry_selected",
  LEADERBOARD_REBUILT: "official_leaderboard_rebuilt",
} as const;

export const OFFICIAL_MESSAGE = {
  LEADERBOARD_LOAD_FAILED: "Failed to load leaderboard data. Please try again.",
  DEFAULT_ORGANIZATION_NAME: "Organization",
} as const;
