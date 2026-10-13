import type { Result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  IDENTIFICATION_TYPE_USE_CASES_LOG_SCOPE,
  IdentificationTypeUseCaseMessage,
} from "./IdentificationTypeUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
} from "./UseCaseResultGuards";

interface IdentificationTypeFailureTarget {
  event: string;
  context: Record<string, unknown>;
  code?: UseCaseErrorCode;
  user_message?: string;
}

export function fail_missing_identification_type_identifier(
  event: string,
  user_message: string = IdentificationTypeUseCaseMessage.ID_REQUIRED,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: IDENTIFICATION_TYPE_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

export function fail_identification_type_validation(
  target: IdentificationTypeFailureTarget,
  validation_errors: string[],
): Result<never, string> {
  return fail_validation(
    {
      log_scope: IDENTIFICATION_TYPE_USE_CASES_LOG_SCOPE,
      event: target.event,
      context: target.context,
    },
    validation_errors,
  );
}

export function forward_identification_type_result<TData>(
  result: Result<TData>,
  target: IdentificationTypeFailureTarget,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: IDENTIFICATION_TYPE_USE_CASES_LOG_SCOPE,
    event: target.event,
    context: target.context,
    code: target.code ?? UseCaseErrorCode.DEPENDENCY_FAILED,
    user_message: target.user_message,
  });
}
