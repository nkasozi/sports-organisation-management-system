import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../entities/PlayerPosition";
import { validate_player_position_input } from "../entities/PlayerPosition";
import type { PlayerPositionRepository } from "../interfaces/adapters/PlayerPositionRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { get_player_position_repository } from "../../adapters/repositories/InBrowserPlayerPositionRepository";
import type { EntityOperationResult, EntityListResult } from "./BaseUseCases";
import type { PlayerPositionUseCasesPort } from "../interfaces/ports/PlayerPositionUseCasesPort";

export type PlayerPositionUseCases = PlayerPositionUseCasesPort;

export function create_player_position_use_cases(
  repository: PlayerPositionRepository,
): PlayerPositionUseCases {
  return {
    async list(
      filter?: PlayerPositionFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<PlayerPosition>> {
      const page_number = pagination?.page ?? 1;
      const page_size = pagination?.page_size ?? 10;
      const query_options = { page_number, page_size };

      const positions_result = filter
        ? await repository.find_by_filter(filter, query_options)
        : await repository.find_all(query_options);

      if (!positions_result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: positions_result.error,
        };
      }

      return {
        success: true,
        data: positions_result.data?.items || [],
        total_count: positions_result.data?.total_count || 0,
      };
    },

    async get_by_id(
      id: string,
    ): Promise<EntityOperationResult<PlayerPosition>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Position ID is required" };
      }

      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreatePlayerPositionInput,
    ): Promise<EntityOperationResult<PlayerPosition>> {
      const validation = validate_player_position_input(input);
      if (!validation.is_valid) {
        return { success: false, error_message: validation.errors.join(", ") };
      }

      const existing = await repository.find_by_code(input.code);
      if (existing) {
        return {
          success: false,
          error_message: `Position with code '${input.code}' already exists`,
        };
      }

      const result = await repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdatePlayerPositionInput,
    ): Promise<EntityOperationResult<PlayerPosition>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Position ID is required" };
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return { success: false, error_message: "Position not found" };
      }

      if (input.code) {
        const code_check = await repository.find_by_code(input.code);
        if (code_check && code_check.id !== id) {
          return {
            success: false,
            error_message: `Position with code '${input.code}' already exists`,
          };
        }
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Position ID is required" };
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async find_by_code(code: string): AsyncResult<PlayerPosition | null> {
      const position = await repository.find_by_code(code);
      return create_success_result(position);
    },

    async find_by_sport_type(
      sport_type: string,
    ): AsyncResult<PlayerPosition[]> {
      const positions = await repository.find_by_sport_type(sport_type);
      return create_success_result(positions);
    },

    async find_by_category(
      category: PlayerPosition["category"],
    ): AsyncResult<PlayerPosition[]> {
      const positions = await repository.find_by_category(category);
      return create_success_result(positions);
    },

    async find_available_positions(): AsyncResult<PlayerPosition[]> {
      const positions = await repository.find_available_positions();
      return create_success_result(positions);
    },

    async list_positions_by_sport(
      sport_type: string,
    ): Promise<EntityListResult<PlayerPosition>> {
      if (!sport_type || sport_type.trim() === "") {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Sport type is required",
        };
      }
      const positions = await repository.find_by_sport_type(sport_type);
      return {
        success: true,
        data: positions,
        total_count: positions.length,
      };
    },
  };
}

let use_cases_instance: PlayerPositionUseCases | null = null;

export function get_player_position_use_cases(): PlayerPositionUseCases {
  if (!use_cases_instance) {
    const repository = get_player_position_repository();
    use_cases_instance = create_player_position_use_cases(repository);
  }
  return use_cases_instance;
}
