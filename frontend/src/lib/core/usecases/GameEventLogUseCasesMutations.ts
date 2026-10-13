import type {
  CreateGameEventLogInput,
  GameEventLog,
  UpdateGameEventLogInput,
} from "../entities/GameEventLog";
import type {
  GameEventLogRepository,
  GameEventLogUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  GameEventLogUseCaseEvent,
  GameEventLogUseCaseMessage,
} from "./GameEventLogUseCasesConstants";
import {
  fail_game_event_log_rule,
  fail_missing_game_event_log_identifier,
  forward_game_event_log_result,
} from "./GameEventLogUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type GameEventLogMutationMethods = Pick<
  GameEventLogUseCasesPort,
  "create" | "update" | "delete"
>;

export type GameEventLogId = ScalarValueInput<GameEventLog["id"]>;

function validate_create_game_event_log_input(
  input: CreateGameEventLogInput,
): Result<CreateGameEventLogInput> {
  const required_identifiers = [
    [
      input.live_game_log_id,
      GameEventLogUseCaseEvent.CREATE_LIVE_GAME_LOG_ID_MISSING,
      GameEventLogUseCaseMessage.LIVE_GAME_LOG_ID_REQUIRED,
    ],
    [
      input.fixture_id,
      GameEventLogUseCaseEvent.CREATE_FIXTURE_ID_MISSING,
      GameEventLogUseCaseMessage.FIXTURE_ID_REQUIRED,
    ],
    [
      input.organization_id,
      GameEventLogUseCaseEvent.CREATE_ORGANIZATION_ID_MISSING,
      GameEventLogUseCaseMessage.ORGANIZATION_ID_REQUIRED,
    ],
  ] as const;
  const missing = required_identifiers.find(([value]) =>
    is_blank_identifier(value),
  );
  if (missing !== undefined) {
    return fail_missing_game_event_log_identifier(missing[1], missing[2]);
  }
  if (is_blank_identifier(input.event_type)) {
    return fail_game_event_log_rule(
      {
        event: GameEventLogUseCaseEvent.CREATE_EVENT_TYPE_MISSING,
        context: { fixture_id: input.fixture_id },
        user_message: GameEventLogUseCaseMessage.EVENT_TYPE_REQUIRED,
      },
      UseCaseErrorCode.VALIDATION_FAILED,
    );
  }
  return create_success_result(input);
}

async function create_game_event_log(
  repository: GameEventLogRepository,
  input: CreateGameEventLogInput,
): AsyncResult<GameEventLog> {
  const validation_result = validate_create_game_event_log_input(input);
  if (!validation_result.success) {
    return validation_result;
  }
  return forward_game_event_log_result(await repository.create(input), {
    event: GameEventLogUseCaseEvent.CREATE_FAILED,
    context: { fixture_id: input.fixture_id },
  });
}

export async function find_existing_game_event_log(
  repository: GameEventLogRepository,
  id: GameEventLogId,
  event: string,
): AsyncResult<GameEventLog> {
  return forward_game_event_log_result(await repository.find_by_id(id), {
    event,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { game_event_log_id: id },
    user_message: GameEventLogUseCaseMessage.NOT_FOUND,
  });
}

async function update_game_event_log(
  repository: GameEventLogRepository,
  id: GameEventLogId,
  input: UpdateGameEventLogInput,
): AsyncResult<GameEventLog> {
  if (is_blank_identifier(id)) {
    return fail_missing_game_event_log_identifier(
      GameEventLogUseCaseEvent.UPDATE_ID_MISSING,
      GameEventLogUseCaseMessage.ID_REQUIRED,
    );
  }
  const existing_result = await find_existing_game_event_log(
    repository,
    id,
    GameEventLogUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
  );
  if (!existing_result.success) {
    return existing_result;
  }
  if (existing_result.data.voided) {
    return fail_game_event_log_rule(
      {
        event: GameEventLogUseCaseEvent.UPDATE_TARGET_VOIDED,
        context: { game_event_log_id: id },
        user_message: GameEventLogUseCaseMessage.CANNOT_UPDATE_VOIDED,
      },
      UseCaseErrorCode.INVALID_STATE_TRANSITION,
    );
  }
  return forward_game_event_log_result(await repository.update(id, input), {
    event: GameEventLogUseCaseEvent.UPDATE_FAILED,
    context: { game_event_log_id: id },
  });
}

async function delete_game_event_log(
  repository: GameEventLogRepository,
  id: GameEventLogId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_game_event_log_identifier(
      GameEventLogUseCaseEvent.DELETE_ID_MISSING,
      GameEventLogUseCaseMessage.ID_REQUIRED,
    );
  }
  const existing_result = await find_existing_game_event_log(
    repository,
    id,
    GameEventLogUseCaseEvent.DELETE_TARGET_NOT_FOUND,
  );
  if (!existing_result.success) {
    return existing_result;
  }
  return forward_game_event_log_result(await repository.delete_by_id(id), {
    event: GameEventLogUseCaseEvent.DELETE_FAILED,
    context: { game_event_log_id: id },
  });
}

export function create_game_event_log_mutations(
  repository: GameEventLogRepository,
): GameEventLogMutationMethods {
  return {
    create: (input) => create_game_event_log(repository, input),
    update: (id, input) => update_game_event_log(repository, id, input),
    delete: (id) => delete_game_event_log(repository, id),
  };
}
