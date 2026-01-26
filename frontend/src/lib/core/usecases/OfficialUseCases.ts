import type {
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
} from "../entities/Official";
import type {
  OfficialRepository,
  OfficialFilter,
} from "../interfaces/adapters/OfficialRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { OfficialUseCasesPort } from "../interfaces/ports/OfficialUseCasesPort";
import { create_failure_result } from "../types/Result";
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

    async get_by_id(id: string): Promise<EntityOperationResult<Official>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Official ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateOfficialInput,
    ): Promise<EntityOperationResult<Official>> {
      const validation_errors = validate_official_input(input);
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
      input: UpdateOfficialInput,
    ): Promise<EntityOperationResult<Official>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Official ID is required" };
      }
      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Official ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete_officials(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return { success: false, error: "Official IDs are required" };
      }
      const result = await repository.delete_by_ids(ids);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true, data: result.data };
    },

    async list_officials_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Official>> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },

    async list_officials_by_role_id(
      role_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Official>> {
      if (!role_id || role_id.trim().length === 0) {
        return create_failure_result("Role ID is required");
      }
      return repository.find_by_filter({ role_id }, options);
    },

    async list_available_officials(
      date: string,
      organization_id?: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Official>> {
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
