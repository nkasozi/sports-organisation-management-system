import type {
  CreatePlayerInput,
  Player,
  UpdatePlayerInput,
} from "../entities/Player";
import { validate_player_input } from "../entities/Player";
import { apply_player_input_defaults } from "../entities/PlayerInputDefaults";
import type {
  PlayerFilter,
  PlayerRepository,
  PlayerUseCasesPort,
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
  PLAYER_USE_CASES_LOG_SCOPE,
  PlayerUseCaseEvent,
  PlayerUseCaseMessage,
} from "./PlayerUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type PlayerUseCases = PlayerUseCasesPort;

type PlayerId = ScalarValueInput<Player["id"]>;

function fail_missing_player_identifier(
  event: string,
  user_message: string,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: PLAYER_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

async function list_players(
  repository: PlayerRepository,
  filter: PlayerFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Player> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    log_scope: PLAYER_USE_CASES_LOG_SCOPE,
    event: PlayerUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

async function get_player_by_id(
  repository: PlayerRepository,
  id: PlayerId,
): AsyncResult<Player> {
  if (is_blank_identifier(id)) {
    return fail_missing_player_identifier(
      PlayerUseCaseEvent.GET_ID_MISSING,
      PlayerUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: PLAYER_USE_CASES_LOG_SCOPE,
    event: PlayerUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { player_id: id },
  });
}

async function create_player(
  repository: PlayerRepository,
  submitted_input: CreatePlayerInput,
): AsyncResult<Player> {
  const input = apply_player_input_defaults(submitted_input);
  const validation_errors = validate_player_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: PLAYER_USE_CASES_LOG_SCOPE,
        event: PlayerUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: { organization_id: input.organization_id },
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: PLAYER_USE_CASES_LOG_SCOPE,
    event: PlayerUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { organization_id: input.organization_id },
  });
}

async function update_player(
  repository: PlayerRepository,
  id: PlayerId,
  input: UpdatePlayerInput,
): AsyncResult<Player> {
  if (is_blank_identifier(id)) {
    return fail_missing_player_identifier(
      PlayerUseCaseEvent.UPDATE_ID_MISSING,
      PlayerUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: PLAYER_USE_CASES_LOG_SCOPE,
    event: PlayerUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { player_id: id },
  });
}

async function delete_player(
  repository: PlayerRepository,
  id: PlayerId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_player_identifier(
      PlayerUseCaseEvent.DELETE_ID_MISSING,
      PlayerUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: PLAYER_USE_CASES_LOG_SCOPE,
    event: PlayerUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { player_id: id },
  });
}

async function delete_players(
  repository: PlayerRepository,
  ids: PlayerId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_player_identifier(
      PlayerUseCaseEvent.BULK_DELETE_IDS_MISSING,
      PlayerUseCaseMessage.IDS_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_ids(ids), {
    log_scope: PLAYER_USE_CASES_LOG_SCOPE,
    event: PlayerUseCaseEvent.BULK_DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { player_ids: ids },
  });
}

async function list_players_by_team(
  repository: PlayerRepository,
  team_id: PlayerId,
  options: QueryOptions,
): PaginatedAsyncResult<Player> {
  if (is_blank_identifier(team_id)) {
    return fail_missing_player_identifier(
      PlayerUseCaseEvent.LIST_BY_TEAM_ID_MISSING,
      PlayerUseCaseMessage.TEAM_ID_REQUIRED,
    );
  }
  return forward_dependency_result(
    await repository.find_by_team(team_id, options),
    {
      log_scope: PLAYER_USE_CASES_LOG_SCOPE,
      event: PlayerUseCaseEvent.LIST_BY_TEAM_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { team_id },
    },
  );
}

export function create_player_use_cases(
  repository: PlayerRepository,
): PlayerUseCases {
  return {
    list: (filter, options) =>
      list_players(repository, filter ?? {}, options ?? {}),
    get_by_id: (id) => get_player_by_id(repository, id),
    create: (input) => create_player(repository, input),
    update: (id, input) => update_player(repository, id, input),
    delete: (id) => delete_player(repository, id),
    delete_players: (ids) => delete_players(repository, ids),
    list_players_by_team: (team_id, options) =>
      list_players_by_team(repository, team_id, options ?? {}),
  };
}
