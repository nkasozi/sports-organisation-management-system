import type { Result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  GAME_EVENT_TYPE_USE_CASES_LOG_SCOPE,
  GameEventTypeUseCaseMessage,
} from "./GameEventTypeUseCasesConstants";
import {
  fail_missing_identifier,
  fail_with_message,
  forward_dependency_result,
} from "./UseCaseResultGuards";

interface GameEventTypeFailureTarget {
  event: string;
  context: Record<string, unknown>;
  code?: UseCaseErrorCode;
  user_message?: string;
}

export function fail_missing_game_event_type_id(
  event: string,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: GAME_EVENT_TYPE_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message: GameEventTypeUseCaseMessage.ID_REQUIRED,
  });
}

export function fail_game_event_type_rule(
  target: GameEventTypeFailureTarget & { user_message: string },
  code: UseCaseErrorCode,
): Result<never, string> {
  return fail_with_message(
    {
      log_scope: GAME_EVENT_TYPE_USE_CASES_LOG_SCOPE,
      event: target.event,
      context: target.context,
      user_message: target.user_message,
    },
    code,
  );
}

export function forward_game_event_type_result<TData>(
  result: Result<TData>,
  target: GameEventTypeFailureTarget,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: GAME_EVENT_TYPE_USE_CASES_LOG_SCOPE,
    event: target.event,
    context: target.context,
    code: target.code ?? UseCaseErrorCode.DEPENDENCY_FAILED,
    user_message: target.user_message,
  });
}
