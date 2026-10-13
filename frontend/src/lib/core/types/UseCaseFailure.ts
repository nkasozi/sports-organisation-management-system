import type { Result } from "./Result";
import { create_failure_result } from "./Result";

export const UseCaseErrorCode = {
  VALIDATION_FAILED: "validation_failed",
  MISSING_IDENTIFIER: "missing_identifier",
  NOT_FOUND: "not_found",
  INVALID_STATE_TRANSITION: "invalid_state_transition",
  CONFLICT: "conflict",
  PERMISSION_DENIED: "permission_denied",
  DEPENDENCY_FAILED: "dependency_failed",
  UNEXPECTED: "unexpected",
} as const;

export type UseCaseErrorCode =
  (typeof UseCaseErrorCode)[keyof typeof UseCaseErrorCode];

export const USE_CASE_ERROR_MESSAGES: Record<UseCaseErrorCode, string> = {
  [UseCaseErrorCode.VALIDATION_FAILED]:
    "Some of the details entered are not valid. Please review and try again.",
  [UseCaseErrorCode.MISSING_IDENTIFIER]:
    "We could not tell which record you meant. Please reload and try again.",
  [UseCaseErrorCode.NOT_FOUND]:
    "We could not find that record. It may have been removed.",
  [UseCaseErrorCode.INVALID_STATE_TRANSITION]:
    "That action is not allowed in the record's current state.",
  [UseCaseErrorCode.CONFLICT]:
    "That change conflicts with existing data. Please refresh and try again.",
  [UseCaseErrorCode.PERMISSION_DENIED]:
    "You do not have permission to do that.",
  [UseCaseErrorCode.DEPENDENCY_FAILED]:
    "Something went wrong while saving or loading data. Please try again.",
  [UseCaseErrorCode.UNEXPECTED]:
    "Something unexpected went wrong. Please try again.",
};

export interface UseCaseFailureDetails {
  code: UseCaseErrorCode;
  event: string;
  log_scope: string;
  context: Record<string, unknown>;
  user_message?: string;
  technical_detail?: string;
}

function build_technical_detail_entry(
  details: UseCaseFailureDetails,
): Record<string, string> {
  return details.technical_detail === undefined
    ? {}
    : { technical_detail: details.technical_detail };
}

export function fail_use_case(
  details: UseCaseFailureDetails,
): Result<never, string> {
  console.error(details.log_scope, {
    event: details.event,
    error_code: details.code,
    ...build_technical_detail_entry(details),
    ...details.context,
  });
  return create_failure_result(
    details.user_message ?? USE_CASE_ERROR_MESSAGES[details.code],
  );
}
