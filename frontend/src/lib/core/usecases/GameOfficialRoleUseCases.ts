import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
} from "../entities/GameOfficialRole";
import type {
  GameOfficialRoleRepository,
  GameOfficialRoleFilter,
} from "../interfaces/adapters/GameOfficialRoleRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { get_game_official_role_repository } from "../../adapters/repositories/InBrowserGameOfficialRoleRepository";
import type { EntityOperationResult, EntityListResult } from "./BaseUseCases";
import type { GameOfficialRoleUseCasesPort } from "../interfaces/ports/GameOfficialRoleUseCasesPort";

export type GameOfficialRoleUseCases = GameOfficialRoleUseCasesPort;

export function create_game_official_role_use_cases(
  repository: GameOfficialRoleRepository,
): GameOfficialRoleUseCases {
  return {
    async list(
      filter?: GameOfficialRoleFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<GameOfficialRole>> {
      const query_options = {
        page_number: pagination?.page ?? 1,
        page_size: pagination?.page_size ?? 10,
      };
      const result = await repository.find_all(query_options);
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

    async get_by_id(
      id: string,
    ): Promise<EntityOperationResult<GameOfficialRole>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Official role ID is required",
        };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateGameOfficialRoleInput,
    ): Promise<EntityOperationResult<GameOfficialRole>> {
      if (!input.name || input.name.trim().length < 2) {
        return {
          success: false,
          error_message: "Role name must be at least 2 characters",
        };
      }

      if (!input.code || input.code.trim().length < 2) {
        return {
          success: false,
          error_message: "Role code must be at least 2 characters",
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
      input: UpdateGameOfficialRoleInput,
    ): Promise<EntityOperationResult<GameOfficialRole>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Official role ID is required",
        };
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return { success: false, error_message: "Official role not found" };
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Official role ID is required",
        };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async list_roles_for_sport(
      sport_id: string | null,
    ): AsyncResult<GameOfficialRole[]> {
      const roles = await repository.find_by_sport(sport_id);
      return create_success_result(roles);
    },
  };
}

let use_cases_instance: GameOfficialRoleUseCases | null = null;

export function get_game_official_role_use_cases(): GameOfficialRoleUseCases {
  if (!use_cases_instance) {
    const repository = get_game_official_role_repository();
    use_cases_instance = create_game_official_role_use_cases(repository);
  }
  return use_cases_instance;
}
