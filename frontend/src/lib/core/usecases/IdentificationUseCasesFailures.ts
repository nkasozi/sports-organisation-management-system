import type { Result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  IDENTIFICATION_USE_CASES_LOG_SCOPE,
  IdentificationUseCaseMessage,
} from "./IdentificationUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
} from "./UseCaseResultGuards";

interface IdentificationFailureTarget {
  event: string;
  context: Record<string, unknown>;
  code?: UseCaseErrorCode;
  user_message?: string;
}

export function fail_missing_identification_identifier(
  event: string,
  user_message: string = IdentificationUseCaseMessage.ID_REQUIRED,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: IDENTIFICATION_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

export function fail_identification_validation(
  target: IdentificationFailureTarget,
  validation_errors: string[],
): Result<never, string> {
  return fail_validation(
    {
      log_scope: IDENTIFICATION_USE_CASES_LOG_SCOPE,
      event: target.event,
      context: target.context,
    },
    validation_errors,
  );
}

export function forward_identification_result<TData>(
  result: Result<TData>,
  target: IdentificationFailureTarget,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: IDENTIFICATION_USE_CASES_LOG_SCOPE,
    event: target.event,
    context: target.context,
    code: target.code ?? UseCaseErrorCode.DEPENDENCY_FAILED,
    user_message: target.user_message,
  });
}
