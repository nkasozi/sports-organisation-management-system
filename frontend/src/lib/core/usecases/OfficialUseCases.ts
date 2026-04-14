import type {
  CreateOfficialInput,
  Official,
  UpdateOfficialInput,
} from "../entities/Official";
import { validate_official_input } from "../entities/Official";
import type { OfficialFilter, OfficialRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { OfficialUseCasesPort } from "../interfaces/ports";
import type {
  EntityId,
  IsoDateString,
  ScalarValueInput,
} from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

export type OfficialUseCases = OfficialUseCasesPort;

export function create_official_use_cases(
  repository: OfficialRepository,
): OfficialUseCases {
  return {
    async list(
      filter?: OfficialFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Official> {
      return repository.find_all(filter, options);
    },

    async get_by_id(id: ScalarValueInput<Official["id"]>): AsyncResult<Official> {
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
      id: ScalarValueInput<Official["id"]>,
      input: UpdateOfficialInput,
    ): AsyncResult<Official> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: ScalarValueInput<Official["id"]>): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Official ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_officials(
      ids: Array<ScalarValueInput<Official["id"]>>,
    ): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("Official IDs are required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_officials_by_organization(
      organization_id: ScalarValueInput<Official["organization_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Official> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },

    async list_officials_by_role_id(
      role_id: ScalarValueInput<EntityId>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Official> {
      if (!role_id || role_id.trim().length === 0) {
        return create_failure_result("Role ID is required");
      }
      return repository.find_all({ role_id }, options);
    },

    async list_available_officials(
      date: ScalarValueInput<IsoDateString>,
      organization_id?: ScalarValueInput<Official["organization_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Official> {
      if (!date) {
        return create_failure_result("Date is required");
      }
      return repository.find_available_for_date(date, organization_id, options);
    },
  };
}
