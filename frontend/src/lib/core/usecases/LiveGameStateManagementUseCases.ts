import type {
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../entities/LiveGameLog";
import type {
  LiveGameLogRepository,
  LiveGameLogUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import { LiveGameCommand } from "./LiveGameStateMachine";
import {
  execute_game_transition,
  update_game_tracking_previous,
} from "./LiveGameStateTransitions";
import {
  LIVE_GAME_USE_CASES_LOG_SCOPE,
  LiveGameUseCaseEvent,
  LiveGameUseCaseMessage,
} from "./LiveGameUseCasesConstants";
import { fail_with_message } from "./UseCaseResultGuards";

type LiveGameStateMethods = Pick<
  LiveGameLogUseCasesPort,
  | "start_game"
  | "pause_game"
  | "resume_game"
  | "end_game"
  | "abandon_game"
  | "update_score"
  | "update_game_clock"
  | "advance_period"
>;

type LiveGameId = ScalarValueInput<LiveGameLog["id"]>;

function create_transition_methods(
  repository: LiveGameLogRepository,
): Pick<
  LiveGameStateMethods,
  "start_game" | "pause_game" | "resume_game" | "end_game" | "abandon_game"
> {
  return {
    start_game: (id, user_id) =>
      execute_game_transition(repository, id, {
        command: LiveGameCommand.START,
        user_id,
      }),
    pause_game: (id) =>
      execute_game_transition(repository, id, {
        command: LiveGameCommand.PAUSE,
      }),
    resume_game: (id) =>
      execute_game_transition(repository, id, {
        command: LiveGameCommand.RESUME,
      }),
    end_game: (id, user_id) =>
      execute_game_transition(repository, id, {
        command: LiveGameCommand.END,
        user_id,
      }),
    abandon_game: (id, user_id, reason) =>
      execute_game_transition(repository, id, {
        command: LiveGameCommand.ABANDON,
        user_id,
        reason,
      }),
  };
}

function reject_state_update(
  id: LiveGameId,
  user_message: string,
): ReturnType<typeof fail_with_message> {
  return fail_with_message(
    {
      log_scope: LIVE_GAME_USE_CASES_LOG_SCOPE,
      event: LiveGameUseCaseEvent.STATE_UPDATE_REJECTED,
      context: { live_game_id: id },
      user_message,
    },
    UseCaseErrorCode.VALIDATION_FAILED,
  );
}

function build_clock_update(
  current_minute: ScalarValueInput<LiveGameLog["current_minute"]>,
  stoppage_time_minutes?: ScalarValueInput<
    LiveGameLog["stoppage_time_minutes"]
  >,
): UpdateLiveGameLogInput {
  return stoppage_time_minutes === undefined
    ? { current_minute }
    : { current_minute, stoppage_time_minutes };
}

async function update_score(
  repository: LiveGameLogRepository,
  id: LiveGameId,
  scores: { home_score: number; away_score: number },
): AsyncResult<LiveGameLog> {
  if (scores.home_score < 0 || scores.away_score < 0) {
    return reject_state_update(id, LiveGameUseCaseMessage.NEGATIVE_SCORES);
  }
  return update_game_tracking_previous(repository, id, {
    home_team_score: scores.home_score,
    away_team_score: scores.away_score,
  });
}

export function create_live_game_state_management(
  repository: LiveGameLogRepository,
): LiveGameStateMethods {
  return {
    ...create_transition_methods(repository),
    update_score: (id, home_score, away_score) =>
      update_score(repository, id, { home_score, away_score }),
    update_game_clock: async (id, current_minute, stoppage_time_minutes) =>
      current_minute < 0
        ? reject_state_update(id, LiveGameUseCaseMessage.NEGATIVE_MINUTE)
        : update_game_tracking_previous(
            repository,
            id,
            build_clock_update(current_minute, stoppage_time_minutes),
          ),
    advance_period: (id, new_period) =>
      update_game_tracking_previous(repository, id, {
        current_period: new_period,
      }),
  };
}
