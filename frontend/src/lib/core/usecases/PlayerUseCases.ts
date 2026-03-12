import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../entities/Player";
import type { PlayerRepository, PlayerFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type { PlayerUseCasesPort } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
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
    ): PaginatedAsyncResult<Player> {
      return repository.find_all(filter, options);
    },

    async get_by_id(id: string): AsyncResult<Player> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreatePlayerInput): AsyncResult<Player> {
      const validation_errors = validate_player_input(input);

      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(id: string, input: UpdatePlayerInput): AsyncResult<Player> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_players(ids: string[]): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one player ID is required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_players_by_team(
      team_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Player> {
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
