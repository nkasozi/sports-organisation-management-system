import type {
  PlayerPosition,
  PlayerPositionFilter,
} from "../entities/PlayerPosition";
import type {
  PlayerPositionRepository,
  QueryOptions,
} from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import { build_player_position_target } from "./PlayerPositionUseCasesCodeAvailability";
import {
  PlayerPositionUseCaseEvent,
  PlayerPositionUseCaseMessage,
} from "./PlayerPositionUseCasesConstants";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export function fail_missing_position_input(
  event: string,
  user_message: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    ...build_player_position_target(event, {}),
    user_message,
  });
}

export async function list_player_positions(
  repository: PlayerPositionRepository,
  filter: PlayerPositionFilter | undefined,
  pagination: QueryOptions | undefined,
): PaginatedAsyncResult<PlayerPosition> {
  return forward_dependency_result(
    await repository.find_all(filter, pagination),
    {
      ...build_player_position_target(
        PlayerPositionUseCaseEvent.LIST_FAILED,
        {},
      ),
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
    },
  );
}

export async function get_player_position_by_id(
  repository: PlayerPositionRepository,
  id: PlayerPosition["id"],
): AsyncResult<PlayerPosition> {
  if (is_blank_identifier(id)) {
    return fail_missing_position_input(
      PlayerPositionUseCaseEvent.GET_ID_MISSING,
      PlayerPositionUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    ...build_player_position_target(PlayerPositionUseCaseEvent.GET_FAILED, {
      position_id: id,
    }),
    code: UseCaseErrorCode.NOT_FOUND,
  });
}

export async function find_player_position_by_code(
  repository: PlayerPositionRepository,
  code: string,
): AsyncResult<PlayerPosition> {
  return forward_dependency_result(await repository.find_by_code(code), {
    ...build_player_position_target(
      PlayerPositionUseCaseEvent.FIND_BY_CODE_FAILED,
      {},
    ),
    code: UseCaseErrorCode.NOT_FOUND,
  });
}

export async function find_player_positions_by_sport_type(
  repository: PlayerPositionRepository,
  sport_type: string,
): AsyncResult<PlayerPosition[]> {
  return forward_dependency_result(
    await repository.find_by_sport_type(sport_type),
    {
      ...build_player_position_target(
        PlayerPositionUseCaseEvent.FIND_BY_SPORT_TYPE_FAILED,
        {},
      ),
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
    },
  );
}

export async function find_player_positions_by_category(
  repository: PlayerPositionRepository,
  category: PlayerPosition["category"],
): AsyncResult<PlayerPosition[]> {
  return forward_dependency_result(
    await repository.find_by_category(category),
    {
      ...build_player_position_target(
        PlayerPositionUseCaseEvent.FIND_BY_CATEGORY_FAILED,
        {},
      ),
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
    },
  );
}

export async function find_available_player_positions(
  repository: PlayerPositionRepository,
): AsyncResult<PlayerPosition[]> {
  return forward_dependency_result(
    await repository.find_available_positions(),
    {
      ...build_player_position_target(
        PlayerPositionUseCaseEvent.FIND_AVAILABLE_FAILED,
        {},
      ),
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
    },
  );
}

export async function list_player_positions_by_sport(
  repository: PlayerPositionRepository,
  sport_type: string,
): AsyncResult<PlayerPosition[]> {
  if (is_blank_identifier(sport_type)) {
    return fail_missing_position_input(
      PlayerPositionUseCaseEvent.LIST_BY_SPORT_TYPE_MISSING,
      PlayerPositionUseCaseMessage.SPORT_TYPE_REQUIRED,
    );
  }
  return find_player_positions_by_sport_type(repository, sport_type);
}
