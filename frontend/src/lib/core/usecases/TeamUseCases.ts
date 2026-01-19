import type { Team, CreateTeamInput, UpdateTeamInput } from "../entities/Team";
import type {
  TeamRepository,
  TeamFilter,
} from "../interfaces/adapters/TeamRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { TeamUseCasesPort } from "../interfaces/ports/TeamUseCasesPort";
import { create_failure_result } from "../types/Result";
import { validate_team_input } from "../entities/Team";
import { get_repository_container } from "../../infrastructure/container";

export type TeamUseCases = TeamUseCasesPort;

export function create_team_use_cases(
  repository: TeamRepository,
): TeamUseCases {
  return {
    async list(
      filter?: TeamFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Team>> {
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

    async get_by_id(id: string): Promise<EntityOperationResult<Team>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Team ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(input: CreateTeamInput): Promise<EntityOperationResult<Team>> {
      const validation_errors = validate_team_input(input);
      if (validation_errors.length > 0) {
        return { success: false, error_message: validation_errors.join(", ") };
      }
      const result = await repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdateTeamInput,
    ): Promise<EntityOperationResult<Team>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Team ID is required" };
      }
      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Team ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete_teams(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one team ID is required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_teams_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Team>> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },
  };
}

export function get_team_use_cases(): TeamUseCases {
  const container = get_repository_container();
  return create_team_use_cases(container.team_repository);
}
