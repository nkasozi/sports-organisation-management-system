import type { Result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import { QUALIFICATION_USE_CASES_LOG_SCOPE } from "./QualificationUseCasesConstants";
import {
  fail_validation,
  forward_dependency_result,
} from "./UseCaseResultGuards";

interface QualificationFailureTarget {
  event: string;
  context: Record<string, unknown>;
  code?: UseCaseErrorCode;
  user_message?: string;
}

export function fail_qualification_validation(
  target: QualificationFailureTarget,
  validation_errors: string[],
): Result<never, string> {
  return fail_validation(
    {
      log_scope: QUALIFICATION_USE_CASES_LOG_SCOPE,
      event: target.event,
      context: target.context,
    },
    validation_errors,
  );
}

export function forward_qualification_result<TData>(
  result: Result<TData>,
  target: QualificationFailureTarget,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: QUALIFICATION_USE_CASES_LOG_SCOPE,
    event: target.event,
    context: target.context,
    code: target.code ?? UseCaseErrorCode.DEPENDENCY_FAILED,
    user_message: target.user_message,
  });
}
