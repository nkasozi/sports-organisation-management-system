import type {
  LiveGameLog,
  CreateLiveGameLogInput,
  UpdateLiveGameLogInput,
} from "../entities/LiveGameLog";
import type { GamePeriod } from "../entities/Fixture";
import type {
  LiveGameLogRepository,
  LiveGameLogFilter,
} from "../interfaces/ports";
import type { EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import type { LiveGameLogUseCasesPort } from "../interfaces/ports";
import { get_repository_container } from "../../infrastructure/container";
import { EventBus } from "$lib/infrastructure/events/EventBus";

const ENTITY_TYPE = "livegamelog";

function build_display_name(game: LiveGameLog): string {
  return `Game ${game.fixture_id || game.id} - ${game.game_status || "unknown"}`;
}

function emit_live_game_updated(
  old_game: LiveGameLog,
  updated_game: LiveGameLog,
  changed_fields: string[],
): void {
  EventBus.emit_entity_updated(
    ENTITY_TYPE,
    updated_game.id,
    build_display_name(updated_game),
    old_game as unknown as Record<string, unknown>,
    updated_game as unknown as Record<string, unknown>,
    changed_fields,
  );
}

export type LiveGameLogUseCases = LiveGameLogUseCasesPort;

export function create_live_game_log_use_cases(
  repository: LiveGameLogRepository,
): LiveGameLogUseCases {
  return {
    async create(input: CreateLiveGameLogInput): AsyncResult<LiveGameLog> {
      if (!input.fixture_id?.trim()) {
        return create_failure_result("Fixture ID is required");
      }

      if (!input.organization_id?.trim()) {
        return create_failure_result("Organization ID is required");
      }

      const existing_result = await repository.get_live_game_log_for_fixture(
        input.fixture_id,
      );

      if (existing_result.success) {
        return create_failure_result(
          "A live game log already exists for this fixture",
        );
      }

      return repository.create(input);
    },

    async get_by_id(id: string): AsyncResult<LiveGameLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("LiveGameLog ID is required");
      }
      return repository.find_by_id(id);
    },

    async update(
      id: string,
      input: UpdateLiveGameLogInput,
    ): AsyncResult<LiveGameLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("LiveGameLog ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("LiveGameLog ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      if (existing_result.data.game_status === "in_progress") {
        return create_failure_result("Cannot delete an in-progress game");
      }

      return repository.delete_by_id(id);
    },

    async list(
      filter?: LiveGameLogFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<LiveGameLog>> {
      const result = await repository.find_all(filter, pagination);
      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }
      return {
        success: true,
        data: result.data?.items || [],
        total_count: result.data?.total_count || 0,
      };
    },

    async get_live_game_log_for_fixture(
      fixture_id: string,
    ): AsyncResult<LiveGameLog> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      return repository.get_live_game_log_for_fixture(fixture_id);
    },

    async get_active_games(
      organization_id?: string,
    ): Promise<EntityListResult<LiveGameLog>> {
      return repository.get_active_games(organization_id);
    },

    async start_game(id: string, user_id: string): AsyncResult<LiveGameLog> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      const game = existing_result.data;
      if (game.game_status !== "pre_game" && game.game_status !== "paused") {
        return create_failure_result(
          `Cannot start a game that is ${game.game_status}`,
        );
      }

      const result = await repository.update(id, {
        game_status: "in_progress",
        clock_running: true,
        started_by_user_id: user_id,
        current_period:
          game.current_period === "pre_game"
            ? "first_half"
            : game.current_period,
      });

      if (result.success && result.data) {
        emit_live_game_updated(game, result.data, [
          "game_status",
          "clock_running",
          "started_by_user_id",
          "current_period",
        ]);
      }

      return result;
    },

    async pause_game(id: string): AsyncResult<LiveGameLog> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      const game = existing_result.data;
      if (game.game_status !== "in_progress") {
        return create_failure_result("Can only pause an in-progress game");
      }

      const result = await repository.update(id, {
        game_status: "paused",
        clock_running: false,
      });

      if (result.success && result.data) {
        emit_live_game_updated(game, result.data, [
          "game_status",
          "clock_running",
        ]);
      }

      return result;
    },

    async resume_game(id: string): AsyncResult<LiveGameLog> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      const game = existing_result.data;
      if (game.game_status !== "paused") {
        return create_failure_result("Can only resume a paused game");
      }

      const result = await repository.update(id, {
        game_status: "in_progress",
        clock_running: true,
      });

      if (result.success && result.data) {
        emit_live_game_updated(game, result.data, [
          "game_status",
          "clock_running",
        ]);
      }

      return result;
    },

    async end_game(id: string, user_id: string): AsyncResult<LiveGameLog> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      const game = existing_result.data;
      if (game.game_status !== "in_progress" && game.game_status !== "paused") {
        return create_failure_result(
          `Cannot end a game that is ${game.game_status}`,
        );
      }

      const result = await repository.update(id, {
        game_status: "completed",
        clock_running: false,
        current_period: "finished",
        ended_by_user_id: user_id,
      });

      if (result.success && result.data) {
        emit_live_game_updated(game, result.data, [
          "game_status",
          "clock_running",
          "current_period",
          "ended_by_user_id",
        ]);
      }

      return result;
    },

    async abandon_game(
      id: string,
      user_id: string,
      reason: string,
    ): AsyncResult<LiveGameLog> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Live game log not found");
      }

      const game = existing_result.data;
      if (
        game.game_status === "completed" ||
        game.game_status === "abandoned"
      ) {
        return create_failure_result(
          `Cannot abandon a game that is already ${game.game_status}`,
        );
      }

      const result = await repository.update(id, {
        game_status: "abandoned",
        clock_running: false,
        ended_by_user_id: user_id,
        notes: reason,
      });

      if (result.success && result.data) {
        emit_live_game_updated(game, result.data, [
          "game_status",
          "clock_running",
          "ended_by_user_id",
          "notes",
        ]);
      }

      return result;
    },

    async update_score(
      id: string,
      home_score: number,
      away_score: number,
    ): AsyncResult<LiveGameLog> {
      if (home_score < 0 || away_score < 0) {
        return create_failure_result("Scores cannot be negative");
      }

      const old_result = await repository.find_by_id(id);
      const old_game = old_result.success ? old_result.data : undefined;

      const result = await repository.update(id, {
        home_team_score: home_score,
        away_team_score: away_score,
      });

      if (result.success && result.data && old_game) {
        emit_live_game_updated(old_game, result.data, [
          "home_team_score",
          "away_team_score",
        ]);
      }

      return result;
    },

    async update_game_clock(
      id: string,
      current_minute: number,
      stoppage_time_minutes?: number,
    ): AsyncResult<LiveGameLog> {
      if (current_minute < 0) {
        return create_failure_result("Current minute cannot be negative");
      }

      const old_result = await repository.find_by_id(id);
      const old_game = old_result.success ? old_result.data : undefined;

      const updates: UpdateLiveGameLogInput = {
        current_minute,
      };

      if (stoppage_time_minutes !== undefined) {
        updates.stoppage_time_minutes = stoppage_time_minutes;
      }

      const result = await repository.update(id, updates);

      if (result.success && result.data && old_game) {
        const changed = ["current_minute"];
        if (stoppage_time_minutes !== undefined)
          changed.push("stoppage_time_minutes");
        emit_live_game_updated(old_game, result.data, changed);
      }

      return result;
    },

    async advance_period(
      id: string,
      new_period: string,
    ): AsyncResult<LiveGameLog> {
      const old_result = await repository.find_by_id(id);
      const old_game = old_result.success ? old_result.data : undefined;

      const result = await repository.update(id, {
        current_period: new_period as GamePeriod,
      });

      if (result.success && result.data && old_game) {
        emit_live_game_updated(old_game, result.data, ["current_period"]);
      }

      return result;
    },

    async list_by_organization(
      organization_id: string,
      options?: { page: number; page_size: number },
    ): Promise<EntityListResult<LiveGameLog>> {
      return repository.find_by_organization(organization_id, options);
    },

    async list_completed_games(
      organization_id?: string,
      options?: { page: number; page_size: number },
    ): Promise<EntityListResult<LiveGameLog>> {
      return repository.find_completed_games(organization_id, options);
    },
  };
}

export function get_live_game_log_use_cases(): LiveGameLogUseCases {
  const container = get_repository_container();
  return create_live_game_log_use_cases(container.live_game_log_repository);
}
