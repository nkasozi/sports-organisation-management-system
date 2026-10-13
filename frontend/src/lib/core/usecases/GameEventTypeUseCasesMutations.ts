import type {
  CreateGameEventTypeInput,
  GameEventType,
  UpdateGameEventTypeInput,
} from "../entities/GameEventType";
import type {
  GameEventTypeRepository,
  GameEventTypeUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import { ensure_code_available } from "./GameEventTypeUseCasesCodeAvailability";
import {
  GAME_EVENT_TYPE_MIN_CODE_LENGTH,
  GAME_EVENT_TYPE_MIN_NAME_LENGTH,
  GameEventTypeUseCaseEvent,
  GameEventTypeUseCaseMessage,
} from "./GameEventTypeUseCasesConstants";
import {
  fail_game_event_type_rule,
  fail_missing_game_event_type_id,
  forward_game_event_type_result,
} from "./GameEventTypeUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type GameEventTypeMutationMethods = Pick<
  GameEventTypeUseCasesPort,
  "create" | "update" | "delete"
>;

type GameEventTypeId = ScalarValueInput<GameEventType["id"]>;

function is_too_short(value: string | undefined, min_length: number): boolean {
  return value === undefined || value.trim().length < min_length;
}

function validate_create_input(
  input: CreateGameEventTypeInput,
): Result<CreateGameEventTypeInput> {
  if (is_too_short(input.name, GAME_EVENT_TYPE_MIN_NAME_LENGTH)) {
    return fail_game_event_type_rule(
      {
        event: GameEventTypeUseCaseEvent.CREATE_NAME_INVALID,
        context: { organization_id: input.organization_id },
        user_message: GameEventTypeUseCaseMessage.NAME_TOO_SHORT,
      },
      UseCaseErrorCode.VALIDATION_FAILED,
    );
  }
  if (is_too_short(input.code, GAME_EVENT_TYPE_MIN_CODE_LENGTH)) {
    return fail_game_event_type_rule(
      {
        event: GameEventTypeUseCaseEvent.CREATE_CODE_INVALID,
        context: { organization_id: input.organization_id },
        user_message: GameEventTypeUseCaseMessage.CODE_TOO_SHORT,
      },
      UseCaseErrorCode.VALIDATION_FAILED,
    );
  }
  return create_success_result(input);
}

async function create_game_event_type(
  repository: GameEventTypeRepository,
  input: CreateGameEventTypeInput,
): AsyncResult<GameEventType> {
  const validation_result = validate_create_input(input);
  if (!validation_result.success) {
    return validation_result;
  }
  const code_result = await ensure_code_available(repository, {
    code: input.code,
    context: { organization_id: input.organization_id },
    lookup_failed_event: GameEventTypeUseCaseEvent.CREATE_CODE_LOOKUP_FAILED,
    conflict_event: GameEventTypeUseCaseEvent.CREATE_CODE_CONFLICT,
    is_conflicting: () => true,
  });
  if (!code_result.success) {
    return code_result;
  }
  return forward_game_event_type_result(await repository.create(input), {
    event: GameEventTypeUseCaseEvent.CREATE_FAILED,
    context: { organization_id: input.organization_id },
  });
}

async function ensure_updated_code_available(
  repository: GameEventTypeRepository,
  id: GameEventTypeId,
  code: string | undefined,
): AsyncResult<boolean> {
  if (!code) {
    return create_success_result(true);
  }
  return ensure_code_available(repository, {
    code,
    context: { game_event_type_id: id },
    lookup_failed_event: GameEventTypeUseCaseEvent.UPDATE_CODE_LOOKUP_FAILED,
    conflict_event: GameEventTypeUseCaseEvent.UPDATE_CODE_CONFLICT,
    is_conflicting: (existing) => existing.id !== id,
  });
}

async function update_game_event_type(
  repository: GameEventTypeRepository,
  id: GameEventTypeId,
  input: UpdateGameEventTypeInput,
): AsyncResult<GameEventType> {
  if (is_blank_identifier(id)) {
    return fail_missing_game_event_type_id(
      GameEventTypeUseCaseEvent.UPDATE_ID_MISSING,
    );
  }
  const existing_result = forward_game_event_type_result(
    await repository.find_by_id(id),
    {
      event: GameEventTypeUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { game_event_type_id: id },
      user_message: GameEventTypeUseCaseMessage.NOT_FOUND,
    },
  );
  if (!existing_result.success) {
    return existing_result;
  }
  const code_result = await ensure_updated_code_available(
    repository,
    id,
    input.code,
  );
  if (!code_result.success) {
    return code_result;
  }
  return forward_game_event_type_result(await repository.update(id, input), {
    event: GameEventTypeUseCaseEvent.UPDATE_FAILED,
    context: { game_event_type_id: id },
  });
}

async function delete_game_event_type(
  repository: GameEventTypeRepository,
  id: GameEventTypeId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_game_event_type_id(
      GameEventTypeUseCaseEvent.DELETE_ID_MISSING,
    );
  }
  return forward_game_event_type_result(await repository.delete_by_id(id), {
    event: GameEventTypeUseCaseEvent.DELETE_FAILED,
    context: { game_event_type_id: id },
  });
}

export function create_game_event_type_mutations(
  repository: GameEventTypeRepository,
): GameEventTypeMutationMethods {
  return {
    create: (input) => create_game_event_type(repository, input),
    update: (id, input) => update_game_event_type(repository, id, input),
    delete: (id) => delete_game_event_type(repository, id),
  };
}
