import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../entities/Competition";
import type {
  CompetitionRepository,
  CompetitionFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type { EntityListResult } from "../entities/BaseEntity";
import type { CompetitionUseCasesPort } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
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
      const result = await repository.find_all(filter, options);
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

    async get_by_id(id: string): AsyncResult<Competition> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateCompetitionInput): AsyncResult<Competition> {
      const validation_errors = validate_competition_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateCompetitionInput,
    ): AsyncResult<Competition> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.delete_by_id(id);
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
