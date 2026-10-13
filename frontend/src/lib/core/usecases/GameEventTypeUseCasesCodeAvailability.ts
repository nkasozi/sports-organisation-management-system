import type { GameEventType } from "../entities/GameEventType";
import type { GameEventTypeRepository } from "../interfaces/ports";
import { is_game_event_type_not_found_by_code_error } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  build_duplicate_event_type_code_message,
  GAME_EVENT_TYPE_USE_CASES_LOG_SCOPE,
} from "./GameEventTypeUseCasesConstants";
import { fail_game_event_type_rule } from "./GameEventTypeUseCasesFailures";

interface CodeAvailabilityCheck {
  code: string;
  context: Record<string, unknown>;
  lookup_failed_event: string;
  conflict_event: string;
  is_conflicting: (existing: GameEventType) => boolean;
}

export async function ensure_code_available(
  repository: GameEventTypeRepository,
  check: CodeAvailabilityCheck,
): AsyncResult<boolean> {
  const existing_result = await repository.find_by_code(check.code);
  if (!existing_result.success) {
    return is_game_event_type_not_found_by_code_error(
      existing_result.error,
      check.code,
    )
      ? create_success_result(true)
      : fail_use_case({
          log_scope: GAME_EVENT_TYPE_USE_CASES_LOG_SCOPE,
          event: check.lookup_failed_event,
          code: UseCaseErrorCode.DEPENDENCY_FAILED,
          context: check.context,
          technical_detail: existing_result.error,
        });
  }
  if (!check.is_conflicting(existing_result.data)) {
    return create_success_result(true);
  }
  return fail_game_event_type_rule(
    {
      event: check.conflict_event,
      context: { ...check.context, existing_id: existing_result.data.id },
      user_message: build_duplicate_event_type_code_message(check.code),
    },
    UseCaseErrorCode.CONFLICT,
  );
}
