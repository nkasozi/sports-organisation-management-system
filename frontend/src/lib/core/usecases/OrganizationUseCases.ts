import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../entities/Organization";
import type {
  OrganizationRepository,
  OrganizationFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type { EntityListResult } from "../entities/BaseEntity";
import type { OrganizationUseCasesPort } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
import { validate_organization_input } from "../entities/Organization";
import { get_repository_container } from "../../infrastructure/container";

export type OrganizationUseCases = OrganizationUseCasesPort;

export function create_organization_use_cases(
  repository: OrganizationRepository,
): OrganizationUseCases {
  return {
    async list(
      filter?: OrganizationFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Organization>> {
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

    async get_by_id(id: string): AsyncResult<Organization> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateOrganizationInput): AsyncResult<Organization> {
      const validation_errors = validate_organization_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateOrganizationInput,
    ): AsyncResult<Organization> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_organizations(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result(
          "At least one organization ID is required",
        );
      }
      return repository.delete_by_ids(ids);
    },
  };
}

export function get_organization_use_cases(): OrganizationUseCases {
  const container = get_repository_container();
  return create_organization_use_cases(container.organization_repository);
}
