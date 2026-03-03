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
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { LiveGameLogUseCasesPort } from "../interfaces/ports";
import { get_live_game_log_repository } from "../../adapters/repositories/InBrowserLiveGameLogRepository";

export type LiveGameLogUseCases = LiveGameLogUseCasesPort;

export function create_live_game_log_use_cases(
  repository: LiveGameLogRepository,
): LiveGameLogUseCases {
  return {
    async create(
      input: CreateLiveGameLogInput,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      if (!input.fixture_id?.trim()) {
        return {
          success: false,
          error_message: "Fixture ID is required",
        };
      }

      if (!input.organization_id?.trim()) {
        return {
          success: false,
          error_message: "Organization ID is required",
        };
      }

      const existing_result = await repository.get_live_game_log_for_fixture(
        input.fixture_id,
      );

      if (existing_result.success) {
        return {
          success: false,
          error_message: "A live game log already exists for this fixture",
        };
      }

      return repository.create_live_game_log(input);
    },

    async get_by_id(id: string): Promise<EntityOperationResult<LiveGameLog>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "LiveGameLog ID is required",
        };
      }
      return repository.get_live_game_log_by_id(id);
    },

    async update(
      id: string,
      input: UpdateLiveGameLogInput,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "LiveGameLog ID is required",
        };
      }

      const existing_result = await repository.get_live_game_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Live game log not found",
        };
      }

      return repository.update_live_game_log(id, input);
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "LiveGameLog ID is required",
        };
      }

      const existing_result = await repository.get_live_game_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Live game log not found",
        };
      }

      if (existing_result.data.game_status === "in_progress") {
        return {
          success: false,
          error_message: "Cannot delete an in-progress game",
        };
      }

      return repository.delete_live_game_log(id);
    },

    async list(
      filter?: LiveGameLogFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<LiveGameLog>> {
      return repository.find_by_filter(filter, pagination);
    },

    async get_live_game_log_for_fixture(
      fixture_id: string,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return {
          success: false,
          error_message: "Fixture ID is required",
        };
      }
      return repository.get_live_game_log_for_fixture(fixture_id);
    },

    async get_active_games(
      organization_id?: string,
    ): Promise<EntityListResult<LiveGameLog>> {
      return repository.get_active_games(organization_id);
    },

    async start_game(
      id: string,
      user_id: string,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      const existing_result = await repository.get_live_game_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Live game log not found",
        };
      }

      const game = existing_result.data;
      if (game.game_status !== "pre_game" && game.game_status !== "paused") {
        return {
          success: false,
          error_message: `Cannot start a game that is ${game.game_status}`,
        };
      }

      return repository.update_live_game_log(id, {
        game_status: "in_progress",
        clock_running: true,
        started_by_user_id: user_id,
        current_period:
          game.current_period === "pre_game"
            ? "first_half"
            : game.current_period,
      });
    },

    async pause_game(id: string): Promise<EntityOperationResult<LiveGameLog>> {
      const existing_result = await repository.get_live_game_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Live game log not found",
        };
      }

      const game = existing_result.data;
      if (game.game_status !== "in_progress") {
        return {
          success: false,
          error_message: "Can only pause an in-progress game",
        };
      }

      return repository.update_live_game_log(id, {
        game_status: "paused",
        clock_running: false,
      });
    },

    async resume_game(id: string): Promise<EntityOperationResult<LiveGameLog>> {
      const existing_result = await repository.get_live_game_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Live game log not found",
        };
      }

      const game = existing_result.data;
      if (game.game_status !== "paused") {
        return {
          success: false,
          error_message: "Can only resume a paused game",
        };
      }

      return repository.update_live_game_log(id, {
        game_status: "in_progress",
        clock_running: true,
      });
    },

    async end_game(
      id: string,
      user_id: string,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      const existing_result = await repository.get_live_game_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Live game log not found",
        };
      }

      const game = existing_result.data;
      if (game.game_status !== "in_progress" && game.game_status !== "paused") {
        return {
          success: false,
          error_message: `Cannot end a game that is ${game.game_status}`,
        };
      }

      return repository.update_live_game_log(id, {
        game_status: "completed",
        clock_running: false,
        current_period: "finished",
        ended_by_user_id: user_id,
      });
    },

    async abandon_game(
      id: string,
      user_id: string,
      reason: string,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      const existing_result = await repository.get_live_game_log_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Live game log not found",
        };
      }

      const game = existing_result.data;
      if (
        game.game_status === "completed" ||
        game.game_status === "abandoned"
      ) {
        return {
          success: false,
          error_message: `Cannot abandon a game that is already ${game.game_status}`,
        };
      }

      return repository.update_live_game_log(id, {
        game_status: "abandoned",
        clock_running: false,
        ended_by_user_id: user_id,
        notes: reason,
      });
    },

    async update_score(
      id: string,
      home_score: number,
      away_score: number,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      if (home_score < 0 || away_score < 0) {
        return {
          success: false,
          error_message: "Scores cannot be negative",
        };
      }

      return repository.update_live_game_log(id, {
        home_team_score: home_score,
        away_team_score: away_score,
      });
    },

    async update_game_clock(
      id: string,
      current_minute: number,
      stoppage_time_minutes?: number,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      if (current_minute < 0) {
        return {
          success: false,
          error_message: "Current minute cannot be negative",
        };
      }

      const updates: UpdateLiveGameLogInput = {
        current_minute,
      };

      if (stoppage_time_minutes !== undefined) {
        updates.stoppage_time_minutes = stoppage_time_minutes;
      }

      return repository.update_live_game_log(id, updates);
    },

    async advance_period(
      id: string,
      new_period: string,
    ): Promise<EntityOperationResult<LiveGameLog>> {
      return repository.update_live_game_log(id, {
        current_period: new_period as GamePeriod,
      });
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

let singleton_use_cases: LiveGameLogUseCases | null = null;

export function get_live_game_log_use_cases(): LiveGameLogUseCases {
  if (!singleton_use_cases) {
    singleton_use_cases = create_live_game_log_use_cases(
      get_live_game_log_repository(),
    );
  }
  return singleton_use_cases;
}
