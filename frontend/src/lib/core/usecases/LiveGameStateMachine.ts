import type {
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../entities/LiveGameLog";
import {
  GAME_PERIOD,
  GAME_STATUS,
  type GameStatusValue,
} from "../entities/StatusConstants";
import type { ScalarValueInput } from "../types/DomainScalars";
import {
  build_cannot_abandon_message,
  build_cannot_end_message,
  build_cannot_start_message,
  LiveGameUseCaseMessage,
} from "./LiveGameUseCasesConstants";

export const LiveGameCommand = {
  START: "start",
  PAUSE: "pause",
  RESUME: "resume",
  END: "end",
  ABANDON: "abandon",
} as const;

export type LiveGameCommandValue =
  (typeof LiveGameCommand)[keyof typeof LiveGameCommand];

export const LiveGameTransitionOutcome = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

type LiveGameTransitionDecision =
  | {
      outcome: typeof LiveGameTransitionOutcome.ALLOWED;
      next_status: GameStatusValue;
    }
  | { outcome: typeof LiveGameTransitionOutcome.REJECTED; reason: string };

export type LiveGameTransitionRequest =
  | { command: typeof LiveGameCommand.START; user_id: ActorId }
  | { command: typeof LiveGameCommand.PAUSE }
  | { command: typeof LiveGameCommand.RESUME }
  | { command: typeof LiveGameCommand.END; user_id: ActorId }
  | {
      command: typeof LiveGameCommand.ABANDON;
      user_id: ActorId;
      reason: string;
    };

type ActorId = ScalarValueInput<LiveGameLog["started_by_user_id"]>;

function allow(next_status: GameStatusValue): LiveGameTransitionDecision {
  return { outcome: LiveGameTransitionOutcome.ALLOWED, next_status };
}

function reject(reason: string): LiveGameTransitionDecision {
  return { outcome: LiveGameTransitionOutcome.REJECTED, reason };
}

function decide_start(status: GameStatusValue): LiveGameTransitionDecision {
  switch (status) {
    case GAME_STATUS.PRE_GAME:
    case GAME_STATUS.PAUSED:
      return allow(GAME_STATUS.IN_PROGRESS);
    case GAME_STATUS.IN_PROGRESS:
    case GAME_STATUS.COMPLETED:
    case GAME_STATUS.ABANDONED:
      return reject(build_cannot_start_message(status));
  }
}

function decide_pause(status: GameStatusValue): LiveGameTransitionDecision {
  switch (status) {
    case GAME_STATUS.IN_PROGRESS:
      return allow(GAME_STATUS.PAUSED);
    case GAME_STATUS.PRE_GAME:
    case GAME_STATUS.PAUSED:
    case GAME_STATUS.COMPLETED:
    case GAME_STATUS.ABANDONED:
      return reject(LiveGameUseCaseMessage.CAN_ONLY_PAUSE_IN_PROGRESS);
  }
}

function decide_resume(status: GameStatusValue): LiveGameTransitionDecision {
  switch (status) {
    case GAME_STATUS.PAUSED:
      return allow(GAME_STATUS.IN_PROGRESS);
    case GAME_STATUS.PRE_GAME:
    case GAME_STATUS.IN_PROGRESS:
    case GAME_STATUS.COMPLETED:
    case GAME_STATUS.ABANDONED:
      return reject(LiveGameUseCaseMessage.CAN_ONLY_RESUME_PAUSED);
  }
}

function decide_end(status: GameStatusValue): LiveGameTransitionDecision {
  switch (status) {
    case GAME_STATUS.IN_PROGRESS:
    case GAME_STATUS.PAUSED:
      return allow(GAME_STATUS.COMPLETED);
    case GAME_STATUS.PRE_GAME:
    case GAME_STATUS.COMPLETED:
    case GAME_STATUS.ABANDONED:
      return reject(build_cannot_end_message(status));
  }
}

function decide_abandon(status: GameStatusValue): LiveGameTransitionDecision {
  switch (status) {
    case GAME_STATUS.PRE_GAME:
    case GAME_STATUS.IN_PROGRESS:
    case GAME_STATUS.PAUSED:
      return allow(GAME_STATUS.ABANDONED);
    case GAME_STATUS.COMPLETED:
    case GAME_STATUS.ABANDONED:
      return reject(build_cannot_abandon_message(status));
  }
}

export function decide_live_game_transition(
  status: GameStatusValue,
  command: LiveGameCommandValue,
): LiveGameTransitionDecision {
  switch (command) {
    case LiveGameCommand.START:
      return decide_start(status);
    case LiveGameCommand.PAUSE:
      return decide_pause(status);
    case LiveGameCommand.RESUME:
      return decide_resume(status);
    case LiveGameCommand.END:
      return decide_end(status);
    case LiveGameCommand.ABANDON:
      return decide_abandon(status);
  }
}

function resolve_started_period(
  game: LiveGameLog,
): LiveGameLog["current_period"] {
  return game.current_period === GAME_PERIOD.PRE_GAME
    ? GAME_PERIOD.FIRST_HALF
    : game.current_period;
}

export function build_live_game_transition_updates(
  game: LiveGameLog,
  request: LiveGameTransitionRequest,
  next_status: GameStatusValue,
): UpdateLiveGameLogInput {
  switch (request.command) {
    case LiveGameCommand.START:
      return {
        game_status: next_status,
        clock_running: true,
        started_by_user_id: request.user_id,
        current_period: resolve_started_period(game),
      };
    case LiveGameCommand.PAUSE:
      return { game_status: next_status, clock_running: false };
    case LiveGameCommand.RESUME:
      return { game_status: next_status, clock_running: true };
    case LiveGameCommand.END:
      return {
        game_status: next_status,
        clock_running: false,
        current_period: GAME_PERIOD.FINISHED,
        ended_by_user_id: request.user_id,
      };
    case LiveGameCommand.ABANDON:
      return {
        game_status: next_status,
        clock_running: false,
        ended_by_user_id: request.user_id,
        notes: request.reason,
      };
  }
}
