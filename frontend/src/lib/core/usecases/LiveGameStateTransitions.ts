import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../entities/LiveGameLog";
import type { LiveGameLogRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  build_live_game_transition_updates,
  decide_live_game_transition,
  LiveGameTransitionOutcome,
  type LiveGameTransitionRequest,
} from "./LiveGameStateMachine";
import {
  LIVE_GAME_ENTITY_TYPE,
  LIVE_GAME_UNKNOWN_STATUS_LABEL,
  LIVE_GAME_USE_CASES_LOG_SCOPE,
  LiveGameUseCaseEvent,
  LiveGameUseCaseMessage,
} from "./LiveGameUseCasesConstants";
import {
  fail_with_message,
  forward_dependency_result,
} from "./UseCaseResultGuards";

type LiveGameId = ScalarValueInput<LiveGameLog["id"]>;

function build_display_name(game: LiveGameLog): string {
  return `Game ${game.fixture_id || game.id} - ${game.game_status || LIVE_GAME_UNKNOWN_STATUS_LABEL}`;
}

function emit_live_game_updated(
  old_game: LiveGameLog,
  updated_game: LiveGameLog,
  changed_fields: string[],
): boolean {
  EventBus.emit_entity_updated(
    LIVE_GAME_ENTITY_TYPE,
    updated_game.id,
    build_display_name(updated_game),
    old_game as unknown as Record<string, unknown>,
    updated_game as unknown as Record<string, unknown>,
    changed_fields,
  );
  return true;
}

async function save_live_game_updates(
  repository: LiveGameLogRepository,
  game_id: LiveGameId,
  previous_game: LiveGameLog,
  updates: UpdateLiveGameLogInput,
  event: string,
): AsyncResult<LiveGameLog> {
  const result = forward_dependency_result(
    await repository.update(game_id, updates),
    {
      log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
      event,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { live_game_id: game_id },
    },
  );
  if (!result.success) {
    return result;
  }
  emit_live_game_updated(previous_game, result.data, Object.keys(updates));
  return result;
}

function reject_transition(
  game_id: LiveGameId,
  request: LiveGameTransitionRequest,
  game: LiveGameLog,
  reason: string,
): Result<never> {
  return fail_with_message(
    {
      log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
      event: LiveGameUseCaseEvent.TRANSITION_REJECTED,
      context: {
        live_game_id: game_id,
        command: request.command,
        game_status: game.game_status,
      },
      user_message: reason,
    },
    UseCaseErrorCode.INVALID_STATE_TRANSITION,
  );
}

export async function execute_game_transition(
  repository: LiveGameLogRepository,
  game_id: LiveGameId,
  request: LiveGameTransitionRequest,
): AsyncResult<LiveGameLog> {
  const existing_result = forward_dependency_result(
    await repository.find_by_id(game_id),
    {
      log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
      event: LiveGameUseCaseEvent.TRANSITION_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { live_game_id: game_id, command: request.command },
      user_message: LiveGameUseCaseMessage.NOT_FOUND,
    },
  );
  if (!existing_result.success) {
    return existing_result;
  }
  const game = existing_result.data;
  const decision = decide_live_game_transition(
    game.game_status,
    request.command,
  );
  switch (decision.outcome) {
    case LiveGameTransitionOutcome.REJECTED:
      return reject_transition(game_id, request, game, decision.reason);
    case LiveGameTransitionOutcome.ALLOWED:
      return save_live_game_updates(
        repository,
        game_id,
        game,
        build_live_game_transition_updates(game, request, decision.next_status),
        LiveGameUseCaseEvent.TRANSITION_SAVE_FAILED,
      );
  }
}

export async function update_game_tracking_previous(
  repository: LiveGameLogRepository,
  game_id: LiveGameId,
  updates: UpdateLiveGameLogInput,
): AsyncResult<LiveGameLog> {
  const old_result = await repository.find_by_id(game_id);
  if (old_result.success) {
    return save_live_game_updates(
      repository,
      game_id,
      old_result.data,
      updates,
      LiveGameUseCaseEvent.STATE_UPDATE_FAILED,
    );
  }
  console.warn(LIVE_GAME_USE_CASES_LOG_SCOPE, {
    event: LiveGameUseCaseEvent.PREVIOUS_SNAPSHOT_UNAVAILABLE,
    live_game_id: game_id,
    technical_detail: old_result.error,
  });
  return forward_dependency_result(await repository.update(game_id, updates), {
    log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
    event: LiveGameUseCaseEvent.STATE_UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { live_game_id: game_id },
  });
}
