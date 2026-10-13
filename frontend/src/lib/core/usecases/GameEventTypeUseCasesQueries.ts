import type { EventCategory, GameEventType } from "../entities/GameEventType";
import type {
  GameEventTypeFilter,
  GameEventTypeRepository,
  GameEventTypeUseCasesPort,
  QueryOptions,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import { GameEventTypeUseCaseEvent } from "./GameEventTypeUseCasesConstants";
import {
  fail_missing_game_event_type_id,
  forward_game_event_type_result,
} from "./GameEventTypeUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type GameEventTypeQueryMethods = Pick<
  GameEventTypeUseCasesPort,
  | "list"
  | "get_by_id"
  | "get_event_type_by_code"
  | "list_event_types_for_sport"
  | "list_event_types_by_category"
  | "list_scoring_event_types"
>;

async function list_game_event_types(
  repository: GameEventTypeRepository,
  filter: GameEventTypeFilter | undefined,
  pagination: QueryOptions | undefined,
): PaginatedAsyncResult<GameEventType> {
  return forward_game_event_type_result(
    await repository.find_all(filter, pagination),
    { event: GameEventTypeUseCaseEvent.LIST_FAILED, context: {} },
  );
}

async function get_game_event_type_by_id(
  repository: GameEventTypeRepository,
  id: ScalarValueInput<GameEventType["id"]>,
): AsyncResult<GameEventType> {
  if (is_blank_identifier(id)) {
    return fail_missing_game_event_type_id(
      GameEventTypeUseCaseEvent.GET_ID_MISSING,
    );
  }
  return forward_game_event_type_result(await repository.find_by_id(id), {
    event: GameEventTypeUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { game_event_type_id: id },
  });
}

async function get_game_event_type_by_code(
  repository: GameEventTypeRepository,
  code: string,
): AsyncResult<GameEventType> {
  return forward_game_event_type_result(await repository.find_by_code(code), {
    event: GameEventTypeUseCaseEvent.GET_BY_CODE_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: {},
  });
}

async function list_game_event_types_for_sport(
  repository: GameEventTypeRepository,
  sport_id: ScalarValueInput<NonNullable<GameEventType["sport_id"]>>,
): AsyncResult<GameEventType[]> {
  return forward_game_event_type_result(
    await repository.find_by_sport(sport_id),
    {
      event: GameEventTypeUseCaseEvent.LIST_FOR_SPORT_FAILED,
      context: { sport_id },
    },
  );
}

async function list_game_event_types_by_category(
  repository: GameEventTypeRepository,
  category: EventCategory,
): AsyncResult<GameEventType[]> {
  return forward_game_event_type_result(
    await repository.find_by_category(category),
    {
      event: GameEventTypeUseCaseEvent.LIST_BY_CATEGORY_FAILED,
      context: { category },
    },
  );
}

async function list_scoring_game_event_types(
  repository: GameEventTypeRepository,
): AsyncResult<GameEventType[]> {
  return forward_game_event_type_result(
    await repository.find_scoring_events(),
    { event: GameEventTypeUseCaseEvent.LIST_SCORING_FAILED, context: {} },
  );
}

export function create_game_event_type_queries(
  repository: GameEventTypeRepository,
): GameEventTypeQueryMethods {
  return {
    list: (filter, pagination) =>
      list_game_event_types(repository, filter, pagination),
    get_by_id: (id) => get_game_event_type_by_id(repository, id),
    get_event_type_by_code: (code) =>
      get_game_event_type_by_code(repository, code),
    list_event_types_for_sport: (sport_id) =>
      list_game_event_types_for_sport(repository, sport_id),
    list_event_types_by_category: (category) =>
      list_game_event_types_by_category(repository, category),
    list_scoring_event_types: () => list_scoring_game_event_types(repository),
  };
}
