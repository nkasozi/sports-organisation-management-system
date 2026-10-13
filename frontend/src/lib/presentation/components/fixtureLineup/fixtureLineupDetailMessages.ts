export const FIXTURE_LINEUP_DETAIL_PAGE_TEXT = {
  PAGE_TITLE: "Lineup Details - Sport-Sync",
  ACCESS_DENIED:
    "Access denied: Your role does not have permission to view fixture lineups. Please contact your organization administrator if you believe this is an error.",
  ACCESS_CHECK_FAILED: "Failed to verify lineup access",
  LOAD_FAILED:
    "We couldn't load this lineup. Please refresh the page and try again.",
  UPDATE_FAILED:
    "We couldn't save your lineup changes. Please try again in a moment.",
  SUBMIT_FAILED:
    "We couldn't submit this lineup. Please check your selections and try again.",
  SUBMIT_CONFIRMATION:
    "Submit this lineup? You won't be able to edit it after submission.",
  LINEUP_LIST_PATH: "/fixture-lineups",
  READ_ACTION: "read",
  UPDATE_ACTION: "update",
  ENTITY_TYPE: "fixturelineup",
} as const;

export const FIXTURE_LINEUP_DETAIL_LOG_EVENTS = {
  LOAD_FAILED: "fixture_lineup_detail_load_failed",
  ACTION_FAILED: "fixture_lineup_detail_action_failed",
} as const;
