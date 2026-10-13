import type { Result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  JERSEY_COLOR_USE_CASES_LOG_SCOPE,
  JerseyColorUseCaseMessage,
} from "./JerseyColorUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
} from "./UseCaseResultGuards";

interface JerseyColorFailureTarget {
  event: string;
  context: Record<string, unknown>;
  code?: UseCaseErrorCode;
  user_message?: string;
}

export function fail_missing_jersey_color_identifier(
  event: string,
  user_message: string = JerseyColorUseCaseMessage.ID_REQUIRED,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: JERSEY_COLOR_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

export function fail_jersey_color_validation(
  target: JerseyColorFailureTarget,
  validation_errors: string[],
): Result<never, string> {
  return fail_validation(
    {
      log_scope: JERSEY_COLOR_USE_CASES_LOG_SCOPE,
      event: target.event,
      context: target.context,
    },
    validation_errors,
  );
}

export function forward_jersey_color_result<TData>(
  result: Result<TData>,
  target: JerseyColorFailureTarget,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: JERSEY_COLOR_USE_CASES_LOG_SCOPE,
    event: target.event,
    context: target.context,
    code: target.code ?? UseCaseErrorCode.DEPENDENCY_FAILED,
    user_message: target.user_message,
  });
}
