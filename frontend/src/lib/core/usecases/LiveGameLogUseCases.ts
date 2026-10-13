import type { LiveGameLog } from "../entities/LiveGameLog";
import type {
  LiveGameLogRepository,
  LiveGameLogUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_live_game_log,
  delete_live_game_log,
  update_live_game_log,
} from "./LiveGameLogMutations";
import { create_live_game_state_management } from "./LiveGameStateManagementUseCases";
import {
  LIVE_GAME_USE_CASES_LOG_SCOPE,
  LiveGameUseCaseEvent,
  LiveGameUseCaseMessage,
} from "./LiveGameUseCasesConstants";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type LiveGameLogUseCases = LiveGameLogUseCasesPort;

function forward_lookup<TData>(
  result: Result<TData>,
  event: string,
  context: Record<string, unknown>,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event,
    code: UseCaseErrorCode.NOT_FOUND,
    context,
  });
}

function forward_listing<TData>(
  result: Result<TData>,
  context: Record<string, unknown>,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event: LiveGameUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

async function get_live_game_log_by_id(
  repository: LiveGameLogRepository,
  id: ScalarValueInput<LiveGameLog["id"]>,
): AsyncResult<LiveGameLog> {
  if (is_blank_identifier(id)) {
    return fail_missing_identifier({
      log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
      event: LiveGameUseCaseEvent.GET_ID_MISSING,
      context: {},
      user_message: LiveGameUseCaseMessage.ID_REQUIRED,
    });
  }
  return forward_lookup(
    await repository.find_by_id(id),
    LiveGameUseCaseEvent.GET_FAILED,
    { live_game_id: id },
  );
}

async function get_live_game_log_for_fixture(
  repository: LiveGameLogRepository,
  fixture_id: ScalarValueInput<LiveGameLog["fixture_id"]>,
): AsyncResult<LiveGameLog> {
  if (is_blank_identifier(fixture_id)) {
    return fail_missing_identifier({
      log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
      event: LiveGameUseCaseEvent.FIXTURE_LOOKUP_ID_MISSING,
      context: {},
      user_message: LiveGameUseCaseMessage.FIXTURE_ID_REQUIRED,
    });
  }
  return forward_lookup(
    await repository.get_live_game_log_for_fixture(fixture_id),
    LiveGameUseCaseEvent.FIXTURE_LOOKUP_FAILED,
    { fixture_id },
  );
}

export function create_live_game_log_use_cases(
  repository: LiveGameLogRepository,
): LiveGameLogUseCases {
  return {
    create: (input) => create_live_game_log(repository, input),
    get_by_id: (id) => get_live_game_log_by_id(repository, id),
    update: (id, input) => update_live_game_log(repository, id, input),
    delete: (id) => delete_live_game_log(repository, id),
    list: async (filter, pagination) =>
      forward_listing(await repository.find_all(filter, pagination), {}),
    get_live_game_log_for_fixture: (fixture_id) =>
      get_live_game_log_for_fixture(repository, fixture_id),
    get_active_games: async (organization_id) =>
      forward_dependency_result(
        await repository.get_active_games(organization_id),
        {
          log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
          event: LiveGameUseCaseEvent.ACTIVE_GAMES_LOOKUP_FAILED,
          code: UseCaseErrorCode.DEPENDENCY_FAILED,
          context: { organization_id },
        },
      ),
    ...create_live_game_state_management(repository),
    list_by_organization: async (organization_id, options) =>
      forward_listing(
        await repository.find_by_organization(organization_id, options),
        { organization_id },
      ),
    list_completed_games: async (organization_id, options) =>
      forward_listing(
        await repository.find_completed_games(organization_id, options),
        { organization_id },
      ),
  };
}
