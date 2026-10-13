import type { AsyncResult, Result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";

interface FailureLogTarget {
  log_scope: string;
  event: string;
  context: Record<string, unknown>;
}

export function is_blank_identifier(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

export function fail_missing_identifier(
  target: FailureLogTarget,
  user_message: string,
): Result<never, string> {
  return fail_use_case({
    code: UseCaseErrorCode.MISSING_IDENTIFIER,
    ...target,
    user_message,
  });
}

export function fail_validation(
  target: FailureLogTarget,
  user_message: string,
): Result<never, string> {
  return fail_use_case({
    code: UseCaseErrorCode.VALIDATION_FAILED,
    ...target,
    user_message,
    technical_detail: user_message,
  });
}

export function relay_repository_failure(
  target: FailureLogTarget,
  repository_error: string,
): Result<never, string> {
  return fail_use_case({
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    ...target,
    user_message: repository_error,
    technical_detail: repository_error,
  });
}

export async function relay_repository_result<TData>(
  pending_result: AsyncResult<TData>,
  target: FailureLogTarget,
): AsyncResult<TData> {
  const result = await pending_result;
  if (result.success) return result;
  return relay_repository_failure(target, result.error);
}

export function create_log_target_builder(
  log_scope: string,
): (event: string, context?: Record<string, unknown>) => FailureLogTarget {
  return (event, context = {}) => ({ log_scope, event, context });
}
