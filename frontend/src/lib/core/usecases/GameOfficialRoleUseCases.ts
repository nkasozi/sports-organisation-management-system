import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
} from "../entities/GameOfficialRole";
import type {
  GameOfficialRoleFilter,
  GameOfficialRoleRepository,
  GameOfficialRoleUseCasesPort,
  QueryOptions,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  GAME_OFFICIAL_ROLE_MIN_CODE_LENGTH,
  GAME_OFFICIAL_ROLE_MIN_NAME_LENGTH,
  GAME_OFFICIAL_ROLE_USE_CASES_LOG_SCOPE,
  GameOfficialRoleUseCaseEvent,
  GameOfficialRoleUseCaseMessage,
} from "./GameOfficialRoleUseCasesConstants";
import {
  fail_missing_identifier,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type GameOfficialRoleUseCases = GameOfficialRoleUseCasesPort;

type GameOfficialRoleId = ScalarValueInput<GameOfficialRole["id"]>;

function fail_missing_role_id(event: string): Result<never, string> {
  return fail_missing_identifier({
    log_scope: GAME_OFFICIAL_ROLE_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message: GameOfficialRoleUseCaseMessage.ID_REQUIRED,
  });
}

function forward_role_result<TData>(
  result: Result<TData>,
  event: string,
  context: Record<string, unknown>,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: GAME_OFFICIAL_ROLE_USE_CASES_LOG_SCOPE,
    event,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

function is_too_short(value: string | undefined, min_length: number): boolean {
  return value === undefined || value.trim().length < min_length;
}

function fail_invalid_role_input(
  event: string,
  user_message: string,
  input: CreateGameOfficialRoleInput,
): Result<never, string> {
  return fail_with_message(
    {
      log_scope: GAME_OFFICIAL_ROLE_USE_CASES_LOG_SCOPE,
      event,
      context: { organization_id: input.organization_id },
      user_message,
    },
    UseCaseErrorCode.VALIDATION_FAILED,
  );
}

async function create_role(
  repository: GameOfficialRoleRepository,
  input: CreateGameOfficialRoleInput,
): AsyncResult<GameOfficialRole> {
  if (is_too_short(input.name, GAME_OFFICIAL_ROLE_MIN_NAME_LENGTH)) {
    return fail_invalid_role_input(
      GameOfficialRoleUseCaseEvent.CREATE_NAME_INVALID,
      GameOfficialRoleUseCaseMessage.NAME_TOO_SHORT,
      input,
    );
  }
  if (is_too_short(input.code, GAME_OFFICIAL_ROLE_MIN_CODE_LENGTH)) {
    return fail_invalid_role_input(
      GameOfficialRoleUseCaseEvent.CREATE_CODE_INVALID,
      GameOfficialRoleUseCaseMessage.CODE_TOO_SHORT,
      input,
    );
  }
  return forward_role_result(
    await repository.create(input),
    GameOfficialRoleUseCaseEvent.CREATE_FAILED,
    { organization_id: input.organization_id },
  );
}

async function update_role(
  repository: GameOfficialRoleRepository,
  id: GameOfficialRoleId,
  input: UpdateGameOfficialRoleInput,
): AsyncResult<GameOfficialRole> {
  if (is_blank_identifier(id)) {
    return fail_missing_role_id(GameOfficialRoleUseCaseEvent.UPDATE_ID_MISSING);
  }
  const existing_result = forward_dependency_result(
    await repository.find_by_id(id),
    {
      log_scope: GAME_OFFICIAL_ROLE_USE_CASES_LOG_SCOPE,
      event: GameOfficialRoleUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { game_official_role_id: id },
      user_message: GameOfficialRoleUseCaseMessage.NOT_FOUND,
    },
  );
  if (!existing_result.success) {
    return existing_result;
  }
  return forward_role_result(
    await repository.update(id, input),
    GameOfficialRoleUseCaseEvent.UPDATE_FAILED,
    { game_official_role_id: id },
  );
}

async function delete_role(
  repository: GameOfficialRoleRepository,
  id: GameOfficialRoleId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_role_id(GameOfficialRoleUseCaseEvent.DELETE_ID_MISSING);
  }
  return forward_role_result(
    await repository.delete_by_id(id),
    GameOfficialRoleUseCaseEvent.DELETE_FAILED,
    { game_official_role_id: id },
  );
}

async function get_role_by_id(
  repository: GameOfficialRoleRepository,
  id: GameOfficialRoleId,
): AsyncResult<GameOfficialRole> {
  if (is_blank_identifier(id)) {
    return fail_missing_role_id(GameOfficialRoleUseCaseEvent.GET_ID_MISSING);
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: GAME_OFFICIAL_ROLE_USE_CASES_LOG_SCOPE,
    event: GameOfficialRoleUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { game_official_role_id: id },
  });
}

async function list_roles(
  repository: GameOfficialRoleRepository,
  filter: GameOfficialRoleFilter | undefined,
  pagination: QueryOptions | undefined,
): PaginatedAsyncResult<GameOfficialRole> {
  return forward_role_result(
    await repository.find_all(filter, pagination),
    GameOfficialRoleUseCaseEvent.LIST_FAILED,
    {},
  );
}

async function list_roles_for_sport(
  repository: GameOfficialRoleRepository,
  sport_id: ScalarValueInput<GameOfficialRole["sport_id"]>,
): AsyncResult<GameOfficialRole[]> {
  return forward_role_result(
    await repository.find_by_sport(sport_id),
    GameOfficialRoleUseCaseEvent.LIST_FOR_SPORT_FAILED,
    { sport_id },
  );
}

export function create_game_official_role_use_cases(
  repository: GameOfficialRoleRepository,
): GameOfficialRoleUseCases {
  return {
    list: (filter, pagination) => list_roles(repository, filter, pagination),
    get_by_id: (id) => get_role_by_id(repository, id),
    create: (input) => create_role(repository, input),
    update: (id, input) => update_role(repository, id, input),
    delete: (id) => delete_role(repository, id),
    list_roles_for_sport: (sport_id) =>
      list_roles_for_sport(repository, sport_id),
  };
}
