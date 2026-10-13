import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  CreateGameEventLogInput,
  GameEventLog,
} from "../entities/GameEventLog";
import type {
  GameEventLogRepository,
  GameEventLogUseCasesPort,
} from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import {
  GAME_EVENT_CARD_TYPE_LABELS,
  GAME_EVENT_LOG_DEFAULT_EVENT_LABEL,
  GAME_EVENT_LOG_ENTITY_TYPE,
  GameEventLogUseCaseEvent,
  GameEventRecorderEventType,
  GOAL_SCORE_CHANGE_BY_SIDE,
  NO_SCORE_CHANGE,
  RECORDED_EVENT_DEFAULTS,
} from "./GameEventLogUseCasesConstants";
import { forward_game_event_log_result } from "./GameEventLogUseCasesFailures";

type GameEventRecorderMethods = Pick<
  GameEventLogUseCasesPort,
  "record_goal" | "record_card" | "record_substitution"
>;

type RecordGoalArgs = Parameters<GameEventLogUseCasesPort["record_goal"]>;
type RecordCardArgs = Parameters<GameEventLogUseCasesPort["record_card"]>;
type RecordSubstitutionArgs = Parameters<
  GameEventLogUseCasesPort["record_substitution"]
>;
function emit_game_event_created(event_log: GameEventLog): void {
  EventBus.emit_entity_created(
    GAME_EVENT_LOG_ENTITY_TYPE,
    event_log.id,
    `${event_log.event_type || GAME_EVENT_LOG_DEFAULT_EVENT_LABEL} at ${event_log.minute || 0}'`,
    event_log as unknown as Record<string, unknown>,
  );
}

async function create_and_emit(
  repository: GameEventLogRepository,
  input: CreateGameEventLogInput,
  event: string,
): AsyncResult<GameEventLog> {
  const result = forward_game_event_log_result(await repository.create(input), {
    event,
    context: {
      fixture_id: input.fixture_id,
      live_game_log_id: input.live_game_log_id,
    },
  });
  if (result.success) {
    emit_game_event_created(result.data);
  }
  return result;
}

async function record_goal(
  repository: GameEventLogRepository,
  args: RecordGoalArgs,
): AsyncResult<GameEventLog> {
  const [
    live_game_log_id,
    fixture_id,
    organization_id,
    minute,
    team_side,
    player_id,
    player_name,
    recorded_by_user_id,
  ] = args;
  const input: CreateGameEventLogInput = {
    ...RECORDED_EVENT_DEFAULTS,
    ...GOAL_SCORE_CHANGE_BY_SIDE[team_side],
    organization_id,
    live_game_log_id,
    fixture_id,
    event_type: GameEventRecorderEventType.GOAL,
    minute,
    team_side,
    player_id,
    player_name,
    description: `Goal by ${player_name}`,
    recorded_by_user_id,
  };
  return create_and_emit(
    repository,
    input,
    GameEventLogUseCaseEvent.RECORD_GOAL_FAILED,
  );
}

async function record_card(
  repository: GameEventLogRepository,
  args: RecordCardArgs,
): AsyncResult<GameEventLog> {
  const [
    live_game_log_id,
    fixture_id,
    organization_id,
    minute,
    team_side,
    player_id,
    player_name,
    card_type,
    recorded_by_user_id,
  ] = args;
  const card_label = GAME_EVENT_CARD_TYPE_LABELS.get(card_type) ?? card_type;
  const input: CreateGameEventLogInput = {
    ...RECORDED_EVENT_DEFAULTS,
    ...NO_SCORE_CHANGE,
    organization_id,
    live_game_log_id,
    fixture_id,
    event_type: card_type,
    minute,
    team_side,
    player_id,
    player_name,
    description: `${card_label} for ${player_name}`,
    recorded_by_user_id,
  };
  return create_and_emit(
    repository,
    input,
    GameEventLogUseCaseEvent.RECORD_CARD_FAILED,
  );
}

async function record_substitution(
  repository: GameEventLogRepository,
  args: RecordSubstitutionArgs,
): AsyncResult<GameEventLog> {
  const [
    live_game_log_id,
    fixture_id,
    organization_id,
    minute,
    team_side,
    player_out_id,
    player_out_name,
    player_in_id,
    player_in_name,
    recorded_by_user_id,
  ] = args;
  const input: CreateGameEventLogInput = {
    ...RECORDED_EVENT_DEFAULTS,
    ...NO_SCORE_CHANGE,
    organization_id,
    live_game_log_id,
    fixture_id,
    event_type: GameEventRecorderEventType.SUBSTITUTION,
    minute,
    team_side,
    player_id: player_out_id,
    player_name: player_out_name,
    secondary_player_id: player_in_id,
    secondary_player_name: player_in_name,
    description: `${player_out_name} replaced by ${player_in_name}`,
    recorded_by_user_id,
  };
  return create_and_emit(
    repository,
    input,
    GameEventLogUseCaseEvent.RECORD_SUBSTITUTION_FAILED,
  );
}

export function create_game_event_recorder(
  repository: GameEventLogRepository,
): GameEventRecorderMethods {
  return {
    record_goal: (...args) => record_goal(repository, args),
    record_card: (...args) => record_card(repository, args),
    record_substitution: (...args) => record_substitution(repository, args),
  };
}
