import type {
  CreateLiveGameLogInput,
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../entities/LiveGameLog";
import { GAME_STATUS } from "../entities/StatusConstants";
import type { LiveGameLogRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  LIVE_GAME_USE_CASES_LOG_SCOPE,
  LiveGameUseCaseEvent,
  LiveGameUseCaseMessage,
} from "./LiveGameUseCasesConstants";
import {
  fail_missing_identifier,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

type LiveGameId = ScalarValueInput<LiveGameLog["id"]>;

function fail_missing(event: string, user_message: string): Result<never> {
  return fail_missing_identifier({
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

async function find_existing_live_game(
  repository: LiveGameLogRepository,
  id: LiveGameId,
  event: string,
): AsyncResult<LiveGameLog> {
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { live_game_id: id },
    user_message: LiveGameUseCaseMessage.NOT_FOUND,
  });
}

export async function create_live_game_log(
  repository: LiveGameLogRepository,
  input: CreateLiveGameLogInput,
): AsyncResult<LiveGameLog> {
  if (is_blank_identifier(input.fixture_id)) {
    return fail_missing(
      LiveGameUseCaseEvent.CREATE_FIXTURE_ID_MISSING,
      LiveGameUseCaseMessage.FIXTURE_ID_REQUIRED,
    );
  }
  if (is_blank_identifier(input.organization_id)) {
    return fail_missing(
      LiveGameUseCaseEvent.CREATE_ORGANIZATION_ID_MISSING,
      LiveGameUseCaseMessage.ORGANIZATION_ID_REQUIRED,
    );
  }
  const context = { fixture_id: input.fixture_id };
  const existing_result = await repository.get_live_game_log_for_fixture(
    input.fixture_id,
  );
  if (existing_result.success) {
    return fail_with_message(
      {
        log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
        event: LiveGameUseCaseEvent.CREATE_DUPLICATE_FOR_FIXTURE,
        context: { ...context, live_game_id: existing_result.data.id },
        user_message: LiveGameUseCaseMessage.ALREADY_EXISTS_FOR_FIXTURE,
      },
      UseCaseErrorCode.CONFLICT,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event: LiveGameUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

export async function update_live_game_log(
  repository: LiveGameLogRepository,
  id: LiveGameId,
  input: UpdateLiveGameLogInput,
): AsyncResult<LiveGameLog> {
  if (is_blank_identifier(id)) {
    return fail_missing(
      LiveGameUseCaseEvent.UPDATE_ID_MISSING,
      LiveGameUseCaseMessage.ID_REQUIRED,
    );
  }
  const existing_result = await find_existing_live_game(
    repository,
    id,
    LiveGameUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
  );
  if (!existing_result.success) {
    return existing_result;
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event: LiveGameUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { live_game_id: id },
  });
}

export async function delete_live_game_log(
  repository: LiveGameLogRepository,
  id: LiveGameId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing(
      LiveGameUseCaseEvent.DELETE_ID_MISSING,
      LiveGameUseCaseMessage.ID_REQUIRED,
    );
  }
  const existing_result = await find_existing_live_game(
    repository,
    id,
    LiveGameUseCaseEvent.DELETE_TARGET_NOT_FOUND,
  );
  if (!existing_result.success) {
    return existing_result;
  }
  if (existing_result.data.game_status === GAME_STATUS.IN_PROGRESS) {
    return fail_with_message(
      {
        log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
        event: LiveGameUseCaseEvent.DELETE_IN_PROGRESS_REJECTED,
        context: { live_game_id: id },
        user_message: LiveGameUseCaseMessage.CANNOT_DELETE_IN_PROGRESS,
      },
      UseCaseErrorCode.INVALID_STATE_TRANSITION,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event: LiveGameUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { live_game_id: id },
  });
}
