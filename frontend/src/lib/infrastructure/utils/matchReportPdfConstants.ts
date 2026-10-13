export const MATCH_REPORT_PDF_LOG_EVENT = {
  GENERATION_COMPLETED: "pdf_generation_completed",
  GENERATION_FAILED: "pdf_generation_failed",
  ALL_REPORTS_GENERATION_COMPLETED: "pdf_all_reports_generation_completed",
  ALL_REPORTS_GENERATION_FAILED: "pdf_all_reports_generation_failed",
} as const;

export const MATCH_REPORT_PDF_ERROR_MESSAGE = {
  SINGLE_REPORT_FAILED: "Failed to generate the match report PDF",
  ALL_REPORTS_FAILED: "Failed to generate the match reports PDF",
} as const;

export const MATCH_REPORT_FILENAME_PREFIX = "Match_Report_";
export const MATCH_REPORT_FILENAME_VERSUS = "_vs_";
export const MATCH_REPORT_FILENAME_EXTENSION = ".pdf";
export const UNSAFE_FILENAME_CHARACTERS = /[^a-zA-Z0-9_\-.]/g;
export const SAFE_FILENAME_REPLACEMENT = "_";

export const REMARKS_HEADING = "REMARKS";
export const REMARKS_LEGEND =
  "FG - Field Goal / PC - Penalty Corner / PS - Penalty Stroke";
export const REPORT_START_Y = 10;
