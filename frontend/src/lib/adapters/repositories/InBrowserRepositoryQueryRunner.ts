import type { AsyncResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { format_repository_error } from "./InBrowserBaseRepositoryHelpers";

export enum REPOSITORY_LOG_LEVEL {
  WARN = "warn",
  ERROR = "error",
}

export enum REPOSITORY_ERROR_CODE {
  STORAGE_OPERATION_FAILED = "repository_storage_operation_failed",
}

export type RepositoryLogContext = Readonly<Record<string, string>>;

export interface RepositoryFailureDetails {
  log_message: string;
  event: string;
  operation: string;
  log_level: REPOSITORY_LOG_LEVEL;
  context_ids: RepositoryLogContext;
}

export function create_warning_failure_details(
  log_message: string,
  event: string,
  operation: string,
): RepositoryFailureDetails {
  return {
    log_message,
    event,
    operation,
    log_level: REPOSITORY_LOG_LEVEL.WARN,
    context_ids: {},
  };
}

export function create_error_failure_details(
  log_message: string,
  event: string,
  operation: string,
): RepositoryFailureDetails {
  return {
    ...create_warning_failure_details(log_message, event, operation),
    log_level: REPOSITORY_LOG_LEVEL.ERROR,
  };
}

export function with_failure_context(
  details: RepositoryFailureDetails,
  context_ids: RepositoryLogContext,
): RepositoryFailureDetails {
  return {
    ...details,
    context_ids: { ...details.context_ids, ...context_ids },
  };
}

function log_repository_failure(
  details: RepositoryFailureDetails,
  error: unknown,
): boolean {
  const failure_context = {
    error_code: REPOSITORY_ERROR_CODE.STORAGE_OPERATION_FAILED,
    operation: details.operation,
    ...details.context_ids,
    error: String(error),
  };
  switch (details.log_level) {
    case REPOSITORY_LOG_LEVEL.ERROR:
      console.error(details.log_message, {
        event: details.event,
        ...failure_context,
      });
      return true;
    case REPOSITORY_LOG_LEVEL.WARN:
      console.warn(details.log_message, {
        event: details.event,
        ...failure_context,
      });
      return true;
  }
}

export async function run_repository_query<TData>(
  details: RepositoryFailureDetails,
  query: () => Promise<Result<TData>>,
): AsyncResult<TData> {
  try {
    return await query();
  } catch (error) {
    log_repository_failure(details, error);
    return create_failure_result(format_repository_error(details.operation));
  }
}

export function execute_repository_operation<TData>(
  details: RepositoryFailureDetails,
  operation: () => Promise<TData>,
): AsyncResult<TData> {
  return run_repository_query(details, async () =>
    create_success_result(await operation()),
  );
}
