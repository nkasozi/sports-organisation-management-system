import type {
  IdentificationType,
  CreateIdentificationTypeInput,
  UpdateIdentificationTypeInput,
} from "$lib/core/entities/IdentificationType";
import { validate_identification_type_input } from "$lib/core/entities/IdentificationType";
import type {
  IdentificationTypeRepository,
  IdentificationTypeFilter,
} from "$lib/core/interfaces/adapters/IdentificationTypeRepository";
import type { QueryOptions } from "$lib/core/interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import { get_identification_type_repository } from "$lib/adapters/repositories/InMemoryIdentificationTypeRepository";
import type { IdentificationTypeUseCasesPort } from "$lib/core/interfaces/ports/IdentificationTypeUseCasesPort";

export type IdentificationTypeUseCases = IdentificationTypeUseCasesPort;

export function create_identification_type_use_cases(
  repository: IdentificationTypeRepository,
): IdentificationTypeUseCases {
  return {
    async create(
      input: CreateIdentificationTypeInput,
    ): AsyncResult<IdentificationType> {
      const validation_errors = validate_identification_type_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateIdentificationTypeInput,
    ): AsyncResult<IdentificationType> {
      if (!id || id.trim() === "") {
        return create_failure_result("Identification type ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Identification type not found");
      }

      const merged_input: CreateIdentificationTypeInput = {
        ...existing_result.data,
        ...input,
      };

      const validation_errors =
        validate_identification_type_input(merged_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim() === "") {
        return create_failure_result("Identification type ID is required");
      }
      return repository.delete_by_id(id);
    },

    async get_by_id(id: string): AsyncResult<IdentificationType> {
      if (!id || id.trim() === "") {
        return create_failure_result("Identification type ID is required");
      }
      return repository.find_by_id(id);
    },

    async list(
      filter?: IdentificationTypeFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<IdentificationType> {
      const query_options = options || { page_number: 1, page_size: 100 };

      if (!filter) {
        return repository.find_all(query_options);
      }

      const type_filter: IdentificationTypeFilter = {
        status: filter.status,
      };

      return repository.find_by_filter(type_filter, query_options);
    },

    async list_all(): PaginatedAsyncResult<IdentificationType> {
      return repository.find_all({ page_number: 1, page_size: 1000 });
    },

    async list_types_by_sport(
      sport_id: string,
    ): PaginatedAsyncResult<IdentificationType> {
      if (!sport_id || sport_id.trim() === "") {
        return create_failure_result("Sport ID is required");
      }
      return repository.find_all({ page_number: 1, page_size: 1000 });
    },
  };
}

let identification_type_use_cases_instance: IdentificationTypeUseCases | null =
  null;

export function get_identification_type_use_cases(): IdentificationTypeUseCases {
  if (!identification_type_use_cases_instance) {
    const repository = get_identification_type_repository();
    identification_type_use_cases_instance =
      create_identification_type_use_cases(repository);
  }
  return identification_type_use_cases_instance;
}
