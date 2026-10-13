import {
  fail_use_case,
  USE_CASE_ERROR_MESSAGES,
  type UseCaseFailureDetails,
} from "../types/UseCaseFailure";

export function log_service_failure(details: UseCaseFailureDetails): string {
  const failure = fail_use_case(details);
  return failure.success
    ? USE_CASE_ERROR_MESSAGES[details.code]
    : failure.error;
}
