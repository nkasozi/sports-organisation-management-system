export const MATCH_REPORT_PAGE_TEXT = {
  title_suffix: "Sports Management",
  loading_error_title: "Error Loading Match",
  missing_fixture_id:
    "This match link is incomplete. Please open the match again from the results page.",
  load_failed:
    "We couldn't load this match report. Please check your connection and try again.",
  download_failed:
    "We couldn't download the match report. Please try again in a moment.",
  fallback_back_path: "/competition-results",
  public_data_scope: "match_report" as const,
} as const;

export const MATCH_REPORT_LOG_EVENTS = {
  LOAD_FAILED: "match_report_page_load_failed",
  REFRESH_FAILED: "match_report_page_refresh_failed",
  DOWNLOAD_FAILED: "match_report_page_download_failed",
  AUTH_PROFILE_MISSING: "match_report_page_auth_profile_missing",
  PUBLIC_DATA_FETCH_FAILED: "match_report_page_public_data_fetch_failed",
} as const;

export const MATCH_REPORT_LIVE_POLL_INTERVAL_MS = 10000;
