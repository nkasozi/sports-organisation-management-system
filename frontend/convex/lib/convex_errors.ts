export const ConvexErrorCode = {
  ACCESS_DENIED: "access_denied",
  INVALID_TABLE: "invalid_table",
  INVALID_REQUEST: "invalid_request",
  BATCH_TOO_LARGE: "batch_too_large",
  WRITE_REJECTED: "write_rejected",
} as const;

export type ConvexErrorCodeValue =
  (typeof ConvexErrorCode)[keyof typeof ConvexErrorCode];

export const AUTH_DENIED_MESSAGE = "Access denied";

const CONVEX_ERROR_MESSAGES: Record<ConvexErrorCodeValue, string> = {
  [ConvexErrorCode.ACCESS_DENIED]: AUTH_DENIED_MESSAGE,
  [ConvexErrorCode.INVALID_TABLE]: "This type of data cannot be synced.",
  [ConvexErrorCode.INVALID_REQUEST]:
    "The request could not be processed. Please check the details and try again.",
  [ConvexErrorCode.BATCH_TOO_LARGE]:
    "Too many records were sent at once. Please try again with fewer records.",
  [ConvexErrorCode.WRITE_REJECTED]:
    "This change could not be saved because it is not permitted.",
};

export const NO_ERROR_MESSAGE = "";
export const NO_ERROR_CODE = "";

export interface ConvexFailure {
  success: false;
  error_code: ConvexErrorCodeValue;
  error: string;
}

interface ConvexFailureLogEntry {
  event: string;
  [detail_name: string]: unknown;
}

const CONVEX_FAILURE_LOG_PREFIX = "[Convex] Request failed";

export function build_convex_failure(
  error_code: ConvexErrorCodeValue,
): ConvexFailure {
  return {
    success: false,
    error_code,
    error: CONVEX_ERROR_MESSAGES[error_code],
  };
}

export function log_convex_failure(
  error_code: ConvexErrorCodeValue,
  log_entry: ConvexFailureLogEntry,
): ConvexFailure {
  console.warn(CONVEX_FAILURE_LOG_PREFIX, {
    ...log_entry,
    event: log_entry.event,
    error_code,
  });
  return build_convex_failure(error_code);
}
