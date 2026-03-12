import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../entities/PlayerPosition";
import { validate_player_position_input } from "../entities/PlayerPosition";
import type { PlayerPositionRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { get_repository_container } from "../../infrastructure/container";
import type { PlayerPositionUseCasesPort } from "../interfaces/ports";

export type PlayerPositionUseCases = PlayerPositionUseCasesPort;

export function create_player_position_use_cases(
  repository: PlayerPositionRepository,
): PlayerPositionUseCases {
  return {
    async list(
      filter?: PlayerPositionFilter,
      pagination?: QueryOptions,
    ): PaginatedAsyncResult<PlayerPosition> {
      return repository.find_all(filter, pagination);
    },

    async get_by_id(id: string): AsyncResult<PlayerPosition> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Position ID is required");
      }

      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(
      input: CreatePlayerPositionInput,
    ): AsyncResult<PlayerPosition> {
      const validation = validate_player_position_input(input);
      if (!validation.is_valid) {
        return create_failure_result(validation.errors.join(", "));
      }

      const existing_result = await repository.find_by_code(input.code);
      if (!existing_result.success) {
        return create_failure_result(existing_result.error);
      }
      if (existing_result.data) {
        return create_failure_result(
          `Position with code '${input.code}' already exists`,
        );
      }

      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(
      id: string,
      input: UpdatePlayerPositionInput,
    ): AsyncResult<PlayerPosition> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Position ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return create_failure_result("Position not found");
      }

      if (input.code) {
        const code_check_result = await repository.find_by_code(input.code);
        if (!code_check_result.success) {
          return create_failure_result(code_check_result.error);
        }
        if (code_check_result.data && code_check_result.data.id !== id) {
          return create_failure_result(
            `Position with code '${input.code}' already exists`,
          );
        }
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Position ID is required");
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async find_by_code(code: string): AsyncResult<PlayerPosition | null> {
      return await repository.find_by_code(code);
    },

    async find_by_sport_type(
      sport_type: string,
    ): AsyncResult<PlayerPosition[]> {
      return await repository.find_by_sport_type(sport_type);
    },

    async find_by_category(
      category: PlayerPosition["category"],
    ): AsyncResult<PlayerPosition[]> {
      return await repository.find_by_category(category);
    },

    async find_available_positions(): AsyncResult<PlayerPosition[]> {
      return await repository.find_available_positions();
    },

    async list_positions_by_sport(
      sport_type: string,
    ): AsyncResult<PlayerPosition[]> {
      if (!sport_type || sport_type.trim() === "") {
        return { success: false, error: "Sport type is required" };
      }
      return repository.find_by_sport_type(sport_type);
    },
  };
}

export function get_player_position_use_cases(): PlayerPositionUseCases {
  const container = get_repository_container();
  return create_player_position_use_cases(container.player_position_repository);
}
