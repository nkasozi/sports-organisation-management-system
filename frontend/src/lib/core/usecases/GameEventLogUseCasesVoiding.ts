import { EventBus } from "$lib/infrastructure/events/EventBus";

import type { GameEventLog } from "../entities/GameEventLog";
import type {
  GameEventLogRepository,
  GameEventLogUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  GAME_EVENT_LOG_DEFAULT_EVENT_LABEL,
  GAME_EVENT_LOG_ENTITY_TYPE,
  GAME_EVENT_LOG_VOIDED_CHANGED_FIELDS,
  GameEventLogUseCaseEvent,
  GameEventLogUseCaseMessage,
} from "./GameEventLogUseCasesConstants";
import {
  fail_game_event_log_rule,
  fail_missing_game_event_log_identifier,
  forward_game_event_log_result,
} from "./GameEventLogUseCasesFailures";
import {
  find_existing_game_event_log,
  type GameEventLogId,
} from "./GameEventLogUseCasesMutations";
import { is_blank_identifier } from "./UseCaseResultGuards";

function emit_game_event_voided(
  old_event: GameEventLog,
  voided_event: GameEventLog,
): void {
  EventBus.emit_entity_updated(
    GAME_EVENT_LOG_ENTITY_TYPE,
    voided_event.id,
    `${voided_event.event_type || GAME_EVENT_LOG_DEFAULT_EVENT_LABEL} at ${voided_event.minute || 0}'`,
    old_event as unknown as Record<string, unknown>,
    voided_event as unknown as Record<string, unknown>,
    GAME_EVENT_LOG_VOIDED_CHANGED_FIELDS,
  );
}

async function load_voidable_game_event_log(
  repository: GameEventLogRepository,
  id: GameEventLogId,
  reason: string,
): AsyncResult<GameEventLog> {
  if (is_blank_identifier(id)) {
    return fail_missing_game_event_log_identifier(
      GameEventLogUseCaseEvent.VOID_ID_MISSING,
      GameEventLogUseCaseMessage.ID_REQUIRED,
    );
  }
  if (is_blank_identifier(reason)) {
    return fail_game_event_log_rule(
      {
        event: GameEventLogUseCaseEvent.VOID_REASON_MISSING,
        context: { game_event_log_id: id },
        user_message: GameEventLogUseCaseMessage.VOID_REASON_REQUIRED,
      },
      UseCaseErrorCode.VALIDATION_FAILED,
    );
  }
  const existing_result = await find_existing_game_event_log(
    repository,
    id,
    GameEventLogUseCaseEvent.VOID_TARGET_NOT_FOUND,
  );
  if (!existing_result.success || !existing_result.data.voided) {
    return existing_result;
  }
  return fail_game_event_log_rule(
    {
      event: GameEventLogUseCaseEvent.VOID_TARGET_ALREADY_VOIDED,
      context: { game_event_log_id: id },
      user_message: GameEventLogUseCaseMessage.ALREADY_VOIDED,
    },
    UseCaseErrorCode.INVALID_STATE_TRANSITION,
  );
}

async function void_game_event_log(
  repository: GameEventLogRepository,
  id: GameEventLogId,
  reason: string,
  voided_by_user_id: ScalarValueInput<GameEventLog["reviewed_by_user_id"]>,
): AsyncResult<GameEventLog> {
  const existing_result = await load_voidable_game_event_log(
    repository,
    id,
    reason,
  );
  if (!existing_result.success) {
    return existing_result;
  }
  const void_result = forward_game_event_log_result(
    await repository.void_event(id, reason, voided_by_user_id),
    {
      event: GameEventLogUseCaseEvent.VOID_FAILED,
      context: { game_event_log_id: id, voided_by_user_id },
    },
  );
  if (void_result.success) {
    emit_game_event_voided(existing_result.data, void_result.data);
  }
  return void_result;
}

export function create_game_event_log_voiding(
  repository: GameEventLogRepository,
): Pick<GameEventLogUseCasesPort, "void_event"> {
  return {
    void_event: (id, reason, voided_by_user_id) =>
      void_game_event_log(repository, id, reason, voided_by_user_id),
  };
}
