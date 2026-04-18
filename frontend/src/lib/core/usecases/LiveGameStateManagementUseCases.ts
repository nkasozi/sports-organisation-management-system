import { EventBus } from "$lib/infrastructure/events/EventBus";

import type { GamePeriod } from "../entities/Fixture";
import type {
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../entities/LiveGameLog";
import { GAME_PERIOD, GAME_STATUS } from "../entities/StatusConstants";
import type {
  LiveGameLogRepository,
  LiveGameLogUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

const ENTITY_TYPE = "livegamelog";

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

function build_display_name(game: LiveGameLog): string {
  return `Game ${game.fixture_id || game.id} - ${game.game_status || "unknown"}`;
}
function emit_live_game_updated(
  old_game: LiveGameLog,
  updated_game: LiveGameLog,
  changed_fields: string[],
): boolean {
  EventBus.emit_entity_updated(
    ENTITY_TYPE,
    updated_game.id,
    build_display_name(updated_game),
    old_game as unknown as Record<string, unknown>,
    updated_game as unknown as Record<string, unknown>,
    changed_fields,
  );
  return true;
}

async function execute_game_transition(
  repository: LiveGameLogRepository,
  game_id: ScalarValueInput<LiveGameLog["id"]>,
  validate: (game: LiveGameLog) => string,
  build_updates: (game: LiveGameLog) => UpdateLiveGameLogInput,
  changed_fields: string[],
): AsyncResult<LiveGameLog> {
  const existing_result = await repository.find_by_id(game_id);
  if (!existing_result.success || !existing_result.data)
    return create_failure_result("Live game log not found");
  const game = existing_result.data;
  const validation_error = validate(game);
  if (validation_error) return create_failure_result(validation_error);
  const result = await repository.update(game_id, build_updates(game));
  if (result.success && result.data) {
    emit_live_game_updated(game, result.data, changed_fields);
  }
  return result;
}

export function create_live_game_state_management(
  repository: LiveGameLogRepository,
): LiveGameStateMethods {
  return {
    async start_game(id, user_id) {
      return execute_game_transition(
        repository,
        id,
        (game) =>
          game.game_status !== GAME_STATUS.PRE_GAME &&
          game.game_status !== GAME_STATUS.PAUSED
            ? `Cannot start a game that is ${game.game_status}`
            : "",
        (game) => ({
          game_status: GAME_STATUS.IN_PROGRESS,
          clock_running: true,
          started_by_user_id: user_id,
          current_period:
            game.current_period === "pre_game"
              ? "first_half"
              : game.current_period,
        }),
        [
          "game_status",
          "clock_running",
          "started_by_user_id",
          "current_period",
        ],
      );
    },
    async pause_game(id) {
      return execute_game_transition(
        repository,
        id,
        (game) =>
          game.game_status !== GAME_STATUS.IN_PROGRESS
            ? "Can only pause an in-progress game"
            : "",
        () => ({ game_status: GAME_STATUS.PAUSED, clock_running: false }),
        ["game_status", "clock_running"],
      );
    },
    async resume_game(id) {
      return execute_game_transition(
        repository,
        id,
        (game) =>
          game.game_status !== GAME_STATUS.PAUSED
            ? "Can only resume a paused game"
            : "",
        () => ({ game_status: GAME_STATUS.IN_PROGRESS, clock_running: true }),
        ["game_status", "clock_running"],
      );
    },
    async end_game(id, user_id) {
      return execute_game_transition(
        repository,
        id,
        (game) =>
          game.game_status !== GAME_STATUS.IN_PROGRESS &&
          game.game_status !== GAME_STATUS.PAUSED
            ? `Cannot end a game that is ${game.game_status}`
            : "",
        () => ({
          game_status: GAME_STATUS.COMPLETED,
          clock_running: false,
          current_period: GAME_PERIOD.FINISHED,
          ended_by_user_id: user_id,
        }),
        ["game_status", "clock_running", "current_period", "ended_by_user_id"],
      );
    },
    async abandon_game(id, user_id, reason) {
      return execute_game_transition(
        repository,
        id,
        (game) =>
          game.game_status === GAME_STATUS.COMPLETED ||
          game.game_status === GAME_STATUS.ABANDONED
            ? `Cannot abandon a game that is already ${game.game_status}`
            : "",
        () => ({
          game_status: GAME_STATUS.ABANDONED,
          clock_running: false,
          ended_by_user_id: user_id,
          notes: reason,
        }),
        ["game_status", "clock_running", "ended_by_user_id", "notes"],
      );
    },
    async update_score(id, home_score, away_score) {
      if (home_score < 0 || away_score < 0)
        return create_failure_result("Scores cannot be negative");
      const old_result = await repository.find_by_id(id);
      const result = await repository.update(id, {
        home_team_score: home_score,
        away_team_score: away_score,
      });
      if (!old_result.success || !old_result.data) {
        return result;
      }
      if (result.success && result.data)
        emit_live_game_updated(old_result.data, result.data, [
          "home_team_score",
          "away_team_score",
        ]);
      return result;
    },
    async update_game_clock(id, current_minute, stoppage_time_minutes) {
      if (current_minute < 0)
        return create_failure_result("Current minute cannot be negative");
      const old_result = await repository.find_by_id(id);
      const updates: UpdateLiveGameLogInput = { current_minute };
      if (typeof stoppage_time_minutes === "number") {
        updates.stoppage_time_minutes = stoppage_time_minutes;
      }
      const result = await repository.update(id, updates);
      if (!old_result.success || !old_result.data) {
        return result;
      }
      if (result.success && result.data) {
        const changed =
          typeof stoppage_time_minutes === "number"
            ? ["current_minute", "stoppage_time_minutes"]
            : ["current_minute"];
        emit_live_game_updated(old_result.data, result.data, changed);
      }
      return result;
    },
    async advance_period(id, new_period) {
      const old_result = await repository.find_by_id(id);
      const result = await repository.update(id, {
        current_period: new_period as GamePeriod,
      });
      if (!old_result.success || !old_result.data) {
        return result;
      }
      if (result.success && result.data) {
        emit_live_game_updated(old_result.data, result.data, [
          "current_period",
        ]);
      }
      return result;
    },
  };
}
