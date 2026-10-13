export const MATCH_REPORT_EVENT = {
  DOWNLOAD_FAILED: "match_report_download_failed",
  SAVE_FAILED: "match_report_pdf_save_failed",
  FIXTURE_LOAD_FAILED: "match_report_fixture_load_failed",
  ORGANIZATION_NAME_UNAVAILABLE: "match_report_organization_name_unavailable",
  STAFF_ROLES_UNAVAILABLE: "match_report_staff_roles_unavailable",
  TEAM_STAFF_UNAVAILABLE: "match_report_team_staff_unavailable",
} as const;

export const MATCH_REPORT_MESSAGE = {
  DEFAULT_ORGANIZATION_NAME: "SPORT-SYNC",
  DOWNLOAD_FAILED: "We couldn't download the match report. Please try again.",
  DOWNLOAD_SUCCEEDED: "Match report downloaded!",
  FIXTURE_LOAD_FAILED: "Failed to load match",
  PAGE_DATA_MISSING: "Match report data is not loaded",
  TEAMS_MISSING: "Match report teams are not loaded",
  FALLBACK_STAFF_ROLE: "Staff",
} as const;
