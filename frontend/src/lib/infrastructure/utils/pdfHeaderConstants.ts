export const HEADER_TITLE_SUFFIX = "TECHNICAL REPORT";

export const HEADER_LOGO_FORMAT = "PNG";

export const HEADER_LOGO_SIZE = 15;

export const HEADER_TABLE_HEADINGS = [
  "DATE",
  "GAME WK",
  "POOL",
  "MATCH No.",
  "SCHEDULED PUSH BACK",
  "PUSH BACK TIME",
] as const;

export const HEADER_TABLE_COLUMN_WIDTHS = [28, 22, 30, 22, 42, 42] as const;

export const HEADER_LOG_EVENT = {
  LOGO_DRAW_FAILED: "pdf_logo_draw_failed",
} as const;
