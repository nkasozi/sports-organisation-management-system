export const OFFICIAL_RATING_PANEL_EVENT = {
  OFFICIALS_LOAD_FAILED: "official_rating_panel_officials_load_failed",
  RATINGS_LOAD_FAILED: "official_rating_panel_ratings_load_failed",
  SUBMIT_FAILED: "official_rating_submit_failed",
} as const;

export const OFFICIAL_RATING_PANEL_MESSAGE = {
  OFFICIALS_LOAD_FAILED:
    "We could not load the officials for this match. Please try again.",
  SUBMIT_FAILED: "We could not save this rating. Please try again.",
  SUBMIT_SUCCEEDED_PREFIX: "Rating submitted for",
} as const;
