import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
} from "../entities/GameOfficialRole";
import type {
  GameOfficialRoleRepository,
  GameOfficialRoleFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { get_repository_container } from "../../infrastructure/container";
import type { EntityListResult } from "./BaseUseCases";
import type { GameOfficialRoleUseCasesPort } from "../interfaces/ports";

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
      const result = await repository.find_all(filter, query_options);
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

    async get_by_id(id: string): AsyncResult<GameOfficialRole> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official role ID is required");
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(
      input: CreateGameOfficialRoleInput,
    ): AsyncResult<GameOfficialRole> {
      if (!input.name || input.name.trim().length < 2) {
        return create_failure_result("Role name must be at least 2 characters");
      }

      if (!input.code || input.code.trim().length < 2) {
        return create_failure_result("Role code must be at least 2 characters");
      }

      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(
      id: string,
      input: UpdateGameOfficialRoleInput,
    ): AsyncResult<GameOfficialRole> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official role ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return create_failure_result("Official role not found");
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official role ID is required");
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async list_roles_for_sport(
      sport_id: string | null,
    ): AsyncResult<GameOfficialRole[]> {
      return await repository.find_by_sport(sport_id);
    },
  };
}

export function get_game_official_role_use_cases(): GameOfficialRoleUseCases {
  const container = get_repository_container();
  return create_game_official_role_use_cases(
    container.game_official_role_repository,
  );
}
