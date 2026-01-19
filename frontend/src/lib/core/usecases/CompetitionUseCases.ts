import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../entities/Competition";
import type {
  CompetitionRepository,
  CompetitionFilter,
} from "../interfaces/adapters/CompetitionRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { CompetitionUseCasesPort } from "../interfaces/ports/CompetitionUseCasesPort";
import { create_failure_result } from "../types/Result";
import { validate_competition_input } from "../entities/Competition";
import { get_repository_container } from "../../infrastructure/container";

export type CompetitionUseCases = CompetitionUseCasesPort;

export function create_competition_use_cases(
  repository: CompetitionRepository,
): CompetitionUseCases {
  return {
    async list(
      filter?: CompetitionFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Competition>> {
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

    async get_by_id(id: string): Promise<EntityOperationResult<Competition>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Competition ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateCompetitionInput,
    ): Promise<EntityOperationResult<Competition>> {
      const validation_errors = validate_competition_input(input);
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
      input: UpdateCompetitionInput,
    ): Promise<EntityOperationResult<Competition>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Competition ID is required" };
      }
      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Competition ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete_competitions(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one competition ID is required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_competitions_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Competition>> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },
  };
}

export function get_competition_use_cases(): CompetitionUseCases {
  const container = get_repository_container();
  return create_competition_use_cases(container.competition_repository);
}
