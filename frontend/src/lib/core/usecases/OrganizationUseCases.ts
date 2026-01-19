import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../entities/Organization";
import type {
  OrganizationRepository,
  OrganizationFilter,
} from "../interfaces/adapters/OrganizationRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { OrganizationUseCasesPort } from "../interfaces/ports/OrganizationUseCasesPort";
import { create_failure_result } from "../types/Result";
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

    async get_by_id(id: string): Promise<EntityOperationResult<Organization>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Organization ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateOrganizationInput,
    ): Promise<EntityOperationResult<Organization>> {
      const validation_errors = validate_organization_input(input);
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
      input: UpdateOrganizationInput,
    ): Promise<EntityOperationResult<Organization>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Organization ID is required" };
      }
      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Organization ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
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
