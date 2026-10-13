import type { GameEventLog } from "../entities/GameEventLog";
import type {
  GameEventLogFilter,
  GameEventLogRepository,
  GameEventLogUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  GameEventLogUseCaseEvent,
  GameEventLogUseCaseMessage,
} from "./GameEventLogUseCasesConstants";
import {
  fail_missing_game_event_log_identifier,
  forward_game_event_log_result,
} from "./GameEventLogUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type GameEventLogQueryMethods = Pick<
  GameEventLogUseCasesPort,
  | "get_by_id"
  | "list"
  | "get_events_for_live_game"
  | "get_events_for_fixture"
  | "get_events_for_player"
  | "get_scoring_events_for_live_game"
  | "get_card_events_for_live_game"
>;

type PageOptions = Parameters<
  GameEventLogUseCasesPort["get_events_for_fixture"]
>[1];

function fail_missing_live_game_log_id(event: string): Result<never, string> {
  return fail_missing_game_event_log_identifier(
    event,
    GameEventLogUseCaseMessage.LIVE_GAME_LOG_ID_REQUIRED,
  );
}

async function get_game_event_log_by_id(
  repository: GameEventLogRepository,
  id: ScalarValueInput<GameEventLog["id"]>,
): AsyncResult<GameEventLog> {
  if (is_blank_identifier(id)) {
    return fail_missing_game_event_log_identifier(
      GameEventLogUseCaseEvent.GET_ID_MISSING,
      GameEventLogUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_game_event_log_result(await repository.find_by_id(id), {
    event: GameEventLogUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { game_event_log_id: id },
  });
}

async function list_game_event_logs(
  repository: GameEventLogRepository,
  filter: GameEventLogFilter | undefined,
  pagination: Parameters<GameEventLogUseCasesPort["list"]>[1],
): PaginatedAsyncResult<GameEventLog> {
  return forward_game_event_log_result(
    await repository.find_all(filter, pagination),
    { event: GameEventLogUseCaseEvent.LIST_FAILED, context: {} },
  );
}

async function get_events_for_live_game(
  repository: GameEventLogRepository,
  live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
  options: PageOptions,
): PaginatedAsyncResult<GameEventLog> {
  if (is_blank_identifier(live_game_log_id)) {
    return fail_missing_live_game_log_id(
      GameEventLogUseCaseEvent.LIVE_GAME_EVENTS_ID_MISSING,
    );
  }
  return forward_game_event_log_result(
    await repository.get_events_for_live_game(live_game_log_id, options),
    {
      event: GameEventLogUseCaseEvent.LIVE_GAME_EVENTS_FAILED,
      context: { live_game_log_id },
    },
  );
}

async function get_events_for_fixture(
  repository: GameEventLogRepository,
  fixture_id: ScalarValueInput<GameEventLog["fixture_id"]>,
  options: PageOptions,
): PaginatedAsyncResult<GameEventLog> {
  if (is_blank_identifier(fixture_id)) {
    return fail_missing_game_event_log_identifier(
      GameEventLogUseCaseEvent.FIXTURE_EVENTS_ID_MISSING,
      GameEventLogUseCaseMessage.FIXTURE_ID_REQUIRED,
    );
  }
  return forward_game_event_log_result(
    await repository.get_events_for_fixture(fixture_id, options),
    {
      event: GameEventLogUseCaseEvent.FIXTURE_EVENTS_FAILED,
      context: { fixture_id },
    },
  );
}

async function get_events_for_player(
  repository: GameEventLogRepository,
  player_id: ScalarValueInput<GameEventLog["player_id"]>,
  options: PageOptions,
): PaginatedAsyncResult<GameEventLog> {
  if (is_blank_identifier(player_id)) {
    return fail_missing_game_event_log_identifier(
      GameEventLogUseCaseEvent.PLAYER_EVENTS_ID_MISSING,
      GameEventLogUseCaseMessage.PLAYER_ID_REQUIRED,
    );
  }
  return forward_game_event_log_result(
    await repository.get_events_for_player(player_id, options),
    {
      event: GameEventLogUseCaseEvent.PLAYER_EVENTS_FAILED,
      context: { player_id },
    },
  );
}

async function get_scoring_events_for_live_game(
  repository: GameEventLogRepository,
  live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
): AsyncResult<GameEventLog[]> {
  if (is_blank_identifier(live_game_log_id)) {
    return fail_missing_live_game_log_id(
      GameEventLogUseCaseEvent.SCORING_EVENTS_ID_MISSING,
    );
  }
  return forward_game_event_log_result(
    await repository.get_scoring_events_for_live_game(live_game_log_id),
    {
      event: GameEventLogUseCaseEvent.SCORING_EVENTS_FAILED,
      context: { live_game_log_id },
    },
  );
}

async function get_card_events_for_live_game(
  repository: GameEventLogRepository,
  live_game_log_id: ScalarValueInput<GameEventLog["live_game_log_id"]>,
): AsyncResult<GameEventLog[]> {
  if (is_blank_identifier(live_game_log_id)) {
    return fail_missing_live_game_log_id(
      GameEventLogUseCaseEvent.CARD_EVENTS_ID_MISSING,
    );
  }
  return forward_game_event_log_result(
    await repository.get_card_events_for_live_game(live_game_log_id),
    {
      event: GameEventLogUseCaseEvent.CARD_EVENTS_FAILED,
      context: { live_game_log_id },
    },
  );
}

export function create_game_event_log_queries(
  repository: GameEventLogRepository,
): GameEventLogQueryMethods {
  return {
    get_by_id: (id) => get_game_event_log_by_id(repository, id),
    list: (filter, pagination) =>
      list_game_event_logs(repository, filter, pagination),
    get_events_for_live_game: (live_game_log_id, options) =>
      get_events_for_live_game(repository, live_game_log_id, options),
    get_events_for_fixture: (fixture_id, options) =>
      get_events_for_fixture(repository, fixture_id, options),
    get_events_for_player: (player_id, options) =>
      get_events_for_player(repository, player_id, options),
    get_scoring_events_for_live_game: (live_game_log_id) =>
      get_scoring_events_for_live_game(repository, live_game_log_id),
    get_card_events_for_live_game: (live_game_log_id) =>
      get_card_events_for_live_game(repository, live_game_log_id),
  };
}
