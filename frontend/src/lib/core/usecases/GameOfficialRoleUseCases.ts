import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
} from "../entities/GameOfficialRole";
import type {
  GameOfficialRoleFilter,
  GameOfficialRoleRepository,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { GameOfficialRoleUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

export type GameOfficialRoleUseCases = GameOfficialRoleUseCasesPort;

export function create_game_official_role_use_cases(
  repository: GameOfficialRoleRepository,
): GameOfficialRoleUseCases {
  return {
    async list(
      filter?: GameOfficialRoleFilter,
      pagination?: QueryOptions,
    ): PaginatedAsyncResult<GameOfficialRole> {
      return repository.find_all(filter, pagination);
    },

    async get_by_id(
      id: ScalarValueInput<GameOfficialRole["id"]>,
    ): AsyncResult<GameOfficialRole> {
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
      id: ScalarValueInput<GameOfficialRole["id"]>,
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

    async delete(
      id: ScalarValueInput<GameOfficialRole["id"]>,
    ): AsyncResult<boolean> {
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
      sport_id: ScalarValueInput<GameOfficialRole["sport_id"]>,
    ): AsyncResult<GameOfficialRole[]> {
      return await repository.find_by_sport(sport_id);
    },
  };
}
