import type { Result } from "$lib/core/types/Result";
import {
  fail_use_case,
  UseCaseErrorCode,
} from "$lib/core/types/UseCaseFailure";

export interface UseCaseFailureTarget {
  log_scope: string;
  event: string;
  context: Record<string, unknown>;
}

interface UseCaseMessageFailureTarget extends UseCaseFailureTarget {
  user_message: string;
}

interface DependencyFailureTarget extends UseCaseFailureTarget {
  code: UseCaseErrorCode;
  user_message?: string;
}

export function is_blank_identifier(identifier: string | undefined): boolean {
  return identifier === undefined || identifier.trim().length === 0;
}

export function fail_missing_identifier(
  target: UseCaseMessageFailureTarget,
): Result<never, string> {
  return fail_use_case({
    ...target,
    code: UseCaseErrorCode.MISSING_IDENTIFIER,
  });
}

export function fail_validation(
  target: UseCaseFailureTarget,
  validation_errors: string[],
): Result<never, string> {
  return fail_use_case({
    ...target,
    code: UseCaseErrorCode.VALIDATION_FAILED,
    user_message: validation_errors.join(", "),
  });
}

export function fail_with_message(
  target: UseCaseMessageFailureTarget,
  code: UseCaseErrorCode,
): Result<never, string> {
  return fail_use_case({ ...target, code });
}

export function forward_dependency_result<TData>(
  result: Result<TData, string>,
  target: DependencyFailureTarget,
): Result<TData, string> {
  if (result.success) {
    return result;
  }
  return fail_use_case({ ...target, technical_detail: result.error });
}
