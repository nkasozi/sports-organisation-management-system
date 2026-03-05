import type {
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
} from "../entities/Official";
import type { OfficialRepository, OfficialFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type { EntityListResult } from "../entities/BaseEntity";
import type { OfficialUseCasesPort } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
import { validate_official_input } from "../entities/Official";
import { get_repository_container } from "../../infrastructure/container";

export type OfficialUseCases = OfficialUseCasesPort;

export function create_official_use_cases(
  repository: OfficialRepository,
): OfficialUseCases {
  return {
    async list(
      filter?: OfficialFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Official>> {
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

    async get_by_id(id: string): AsyncResult<Official> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateOfficialInput): AsyncResult<Official> {
      const validation_errors = validate_official_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateOfficialInput,
    ): AsyncResult<Official> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_officials(ids: string[]): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("Official IDs are required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_officials_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Official> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },

    async list_officials_by_role_id(
      role_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Official> {
      if (!role_id || role_id.trim().length === 0) {
        return create_failure_result("Role ID is required");
      }
      return repository.find_by_filter({ role_id }, options);
    },

    async list_available_officials(
      date: string,
      organization_id?: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Official> {
      if (!date) {
        return create_failure_result("Date is required");
      }
      return repository.find_available_for_date(date, organization_id, options);
    },
  };
}

export function get_official_use_cases(): OfficialUseCases {
  const container = get_repository_container();
  return create_official_use_cases(container.official_repository);
}
