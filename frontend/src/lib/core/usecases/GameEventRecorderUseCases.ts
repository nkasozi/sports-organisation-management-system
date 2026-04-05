import type {
  GameEventLog,
  CreateGameEventLogInput,
} from "../entities/GameEventLog";
import type {
  GameEventLogRepository,
  GameEventLogUseCasesPort,
} from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { EventBus } from "$lib/infrastructure/events/EventBus";

type GameEventRecorderMethods = Pick<
  GameEventLogUseCasesPort,
  "record_goal" | "record_card" | "record_substitution"
>;

const CARD_TYPE_LABELS = new Map<string, string>([
  ["yellow_card", "Yellow card"],
  ["red_card", "Red card"],
  ["second_yellow", "Second yellow card"],
  ["green_card", "Green card"],
]);

function emit_game_event_created(event_log: GameEventLog): boolean {
  EventBus.emit_entity_created(
    "gameeventlog",
    event_log.id,
    `${event_log.event_type || "Event"} at ${event_log.minute || 0}'`,
    event_log as unknown as Record<string, unknown>,
  );
  return true;
}

async function create_and_emit(
  repository: GameEventLogRepository,
  input: CreateGameEventLogInput,
): AsyncResult<GameEventLog> {
  const result = await repository.create(input);
  if (result.success && result.data) {
    emit_game_event_created(result.data);
  }
  return result;
}

export function create_game_event_recorder(
  repository: GameEventLogRepository,
): GameEventRecorderMethods {
  return {
    async record_goal(
      live_game_log_id,
      fixture_id,
      organization_id,
      minute,
      team_side,
      player_id,
      player_name,
      recorded_by_user_id,
    ) {
      return create_and_emit(repository, {
        organization_id,
        live_game_log_id,
        fixture_id,
        event_type: "goal",
        minute,
        stoppage_time_minute: null,
        team_side,
        player_id,
        player_name,
        secondary_player_id: "",
        secondary_player_name: "",
        description: `Goal by ${player_name}`,
        affects_score: true,
        score_change_home: team_side === "home" ? 1 : 0,
        score_change_away: team_side === "away" ? 1 : 0,
        recorded_by_user_id,
        status: "active",
      });
    },

    async record_card(
      live_game_log_id,
      fixture_id,
      organization_id,
      minute,
      team_side,
      player_id,
      player_name,
      card_type,
      recorded_by_user_id,
    ) {
      const card_label = CARD_TYPE_LABELS.get(card_type) ?? card_type;
      return create_and_emit(repository, {
        organization_id,
        live_game_log_id,
        fixture_id,
        event_type: card_type,
        minute,
        stoppage_time_minute: null,
        team_side,
        player_id,
        player_name,
        secondary_player_id: "",
        secondary_player_name: "",
        description: `${card_label} for ${player_name}`,
        affects_score: false,
        score_change_home: 0,
        score_change_away: 0,
        recorded_by_user_id,
        status: "active",
      });
    },

    async record_substitution(
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
    ) {
      return create_and_emit(repository, {
        organization_id,
        live_game_log_id,
        fixture_id,
        event_type: "substitution",
        minute,
        stoppage_time_minute: null,
        team_side,
        player_id: player_out_id,
        player_name: player_out_name,
        secondary_player_id: player_in_id,
        secondary_player_name: player_in_name,
        description: `${player_out_name} replaced by ${player_in_name}`,
        affects_score: false,
        score_change_home: 0,
        score_change_away: 0,
        recorded_by_user_id,
        status: "active",
      });
    },
  };
}
