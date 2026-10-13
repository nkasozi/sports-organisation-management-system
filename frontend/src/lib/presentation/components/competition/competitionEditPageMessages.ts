export const COMPETITION_EDIT_PAGE_TEXT = {
  PAGE_TITLE_FALLBACK: "Edit Competition",
  PAGE_TITLE_SUFFIX: "Sports Management",
  LOADING: "Loading competition...",
  MISSING_ID:
    "This competition link is incomplete. Please open the competition again from the list.",
  LOAD_FAILED:
    "We couldn't load this competition. Please refresh the page and try again.",
  ACCESS_DENIED: "You do not have permission to view this competition.",
  LIST_PATH: "/competitions",
} as const;

export const COMPETITION_EDIT_LOG_EVENTS = {
  LOAD_FAILED: "competition_edit_page_load_failed",
} as const;

export const COMPETITION_EDIT_AUTHORIZATION_STATUS = {
  HALTED: "halted",
  PROCEED: "proceed",
} as const;
