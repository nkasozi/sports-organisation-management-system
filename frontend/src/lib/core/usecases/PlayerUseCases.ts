import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../entities/Player";
import type {
  PlayerRepository,
  PlayerFilter,
} from "../interfaces/adapters/PlayerRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { PlayerUseCasesPort } from "../interfaces/ports/PlayerUseCasesPort";
import { create_failure_result } from "../types/Result";
import { validate_player_input } from "../entities/Player";
import { get_repository_container } from "../../infrastructure/container";

export type PlayerUseCases = PlayerUseCasesPort;

export function create_player_use_cases(
  repository: PlayerRepository,
): PlayerUseCases {
  return {
    async list(
      filter?: PlayerFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Player>> {
      const result = filter
        ? await repository.find_by_filter(filter, options)
        : await repository.find_all(options);

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

    async get_by_id(id: string): Promise<EntityOperationResult<Player>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Player ID is required",
        };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }
      return {
        success: true,
        data: result.data,
      };
    },

    async create(
      input: CreatePlayerInput,
    ): Promise<EntityOperationResult<Player>> {
      const validation_errors = validate_player_input(input);

      if (validation_errors.length > 0) {
        return {
          success: false,
          error_message: validation_errors.join(", "),
        };
      }

      const result = await repository.create(input);
      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }
      return {
        success: true,
        data: result.data,
      };
    },

    async update(
      id: string,
      input: UpdatePlayerInput,
    ): Promise<EntityOperationResult<Player>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Player ID is required",
        };
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }
      return {
        success: true,
        data: result.data,
      };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Player ID is required",
        };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }
      return {
        success: true,
        data: result.data,
      };
    },

    async delete_players(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one player ID is required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_players_by_team(
      team_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Player>> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.find_by_team(team_id, options);
    },
  };
}

export function get_player_use_cases(): PlayerUseCases {
  const container = get_repository_container();
  return create_player_use_cases(container.player_repository);
}
