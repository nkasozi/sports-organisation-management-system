export const FIXTURE_MANAGE_TEXT = {
  BACK_PATH: "/fixtures",
  BACK_BUTTON_LABEL: "Back to Fixtures",
  ERROR_TITLE: "Error Loading Game",
  LINEUP_CHECK_FAILED:
    "We couldn't check the team lineups for this fixture. Please try again in a moment.",
  LINEUPS_REQUIRED: "Submit both team lineups before starting the game.",
  LINEUPS_PATH: "/fixture-lineups",
  FIXTURE_ID_QUERY_PARAM: "fixture_id",
} as const;

export const FIXTURE_MANAGE_LOG_EVENTS = {
  LINEUP_CHECK_FAILED: "fixture_manage_lineup_check_failed",
} as const;
