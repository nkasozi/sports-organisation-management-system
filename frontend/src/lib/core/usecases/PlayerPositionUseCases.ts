import type {
  CreatePlayerPositionInput,
  PlayerPosition,
  UpdatePlayerPositionInput,
} from "../entities/PlayerPosition";
import { validate_player_position_input } from "../entities/PlayerPosition";
import type {
  PlayerPositionRepository,
  PlayerPositionUseCasesPort,
} from "../interfaces/ports";
import { create_none_option, create_some_option } from "../types/Option";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  build_player_position_target,
  ensure_position_code_available,
} from "./PlayerPositionUseCasesCodeAvailability";
import {
  PlayerPositionUseCaseEvent,
  PlayerPositionUseCaseMessage,
} from "./PlayerPositionUseCasesConstants";
import {
  fail_missing_position_input,
  find_available_player_positions,
  find_player_position_by_code,
  find_player_positions_by_category,
  find_player_positions_by_sport_type,
  get_player_position_by_id,
  list_player_positions,
  list_player_positions_by_sport,
} from "./PlayerPositionUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type PlayerPositionUseCases = PlayerPositionUseCasesPort;

async function create_player_position(
  repository: PlayerPositionRepository,
  input: CreatePlayerPositionInput,
): AsyncResult<PlayerPosition> {
  const validation = validate_player_position_input(input);
  if (!validation.is_valid) {
    return fail_validation(
      build_player_position_target(
        PlayerPositionUseCaseEvent.CREATE_VALIDATION_FAILED,
        {},
      ),
      validation.errors,
    );
  }
  const code_result = await ensure_position_code_available(repository, {
    code: input.code,
    owner: create_none_option(),
    lookup_failed_event: PlayerPositionUseCaseEvent.CREATE_CODE_LOOKUP_FAILED,
    conflict_event: PlayerPositionUseCaseEvent.CREATE_CODE_CONFLICT,
  });
  if (!code_result.success) {
    return code_result;
  }
  return forward_dependency_result(await repository.create(input), {
    ...build_player_position_target(
      PlayerPositionUseCaseEvent.CREATE_FAILED,
      {},
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function ensure_updated_code_available(
  repository: PlayerPositionRepository,
  id: PlayerPosition["id"],
  input: UpdatePlayerPositionInput,
): AsyncResult<true> {
  if (!input.code) {
    return create_success_result(true);
  }
  return ensure_position_code_available(repository, {
    code: input.code,
    owner: create_some_option(id),
    lookup_failed_event: PlayerPositionUseCaseEvent.UPDATE_CODE_LOOKUP_FAILED,
    conflict_event: PlayerPositionUseCaseEvent.UPDATE_CODE_CONFLICT,
  });
}

async function update_player_position(
  repository: PlayerPositionRepository,
  id: PlayerPosition["id"],
  input: UpdatePlayerPositionInput,
): AsyncResult<PlayerPosition> {
  if (is_blank_identifier(id)) {
    return fail_missing_position_input(
      PlayerPositionUseCaseEvent.UPDATE_ID_MISSING,
      PlayerPositionUseCaseMessage.ID_REQUIRED,
    );
  }
  const context = { position_id: id };
  const existing_result = await repository.find_by_id(id);
  if (!existing_result.success) {
    return forward_dependency_result(existing_result, {
      ...build_player_position_target(
        PlayerPositionUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
        context,
      ),
      code: UseCaseErrorCode.NOT_FOUND,
      user_message: PlayerPositionUseCaseMessage.NOT_FOUND,
    });
  }
  const code_result = await ensure_updated_code_available(
    repository,
    id,
    input,
  );
  if (!code_result.success) {
    return code_result;
  }
  return forward_dependency_result(await repository.update(id, input), {
    ...build_player_position_target(
      PlayerPositionUseCaseEvent.UPDATE_FAILED,
      context,
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_player_position(
  repository: PlayerPositionRepository,
  id: PlayerPosition["id"],
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_position_input(
      PlayerPositionUseCaseEvent.DELETE_ID_MISSING,
      PlayerPositionUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    ...build_player_position_target(PlayerPositionUseCaseEvent.DELETE_FAILED, {
      position_id: id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export function create_player_position_use_cases(
  repository: PlayerPositionRepository,
): PlayerPositionUseCases {
  return {
    list: (filter, pagination) =>
      list_player_positions(repository, filter, pagination),
    get_by_id: (id: PlayerPosition["id"]) =>
      get_player_position_by_id(repository, id),
    create: (input) => create_player_position(repository, input),
    update: (id: PlayerPosition["id"], input) =>
      update_player_position(repository, id, input),
    delete: (id: PlayerPosition["id"]) =>
      delete_player_position(repository, id),
    find_by_code: (code) => find_player_position_by_code(repository, code),
    find_by_sport_type: (sport_type) =>
      find_player_positions_by_sport_type(repository, sport_type),
    find_by_category: (category) =>
      find_player_positions_by_category(repository, category),
    find_available_positions: () => find_available_player_positions(repository),
    list_positions_by_sport: (sport_type) =>
      list_player_positions_by_sport(repository, sport_type),
  };
}
