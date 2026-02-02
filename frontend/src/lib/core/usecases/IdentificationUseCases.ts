import type {
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput,
  IdentificationHolderType,
} from "$lib/core/entities/Identification";
import { validate_identification_input } from "$lib/core/entities/Identification";
import type {
  IdentificationRepository,
  IdentificationFilter,
} from "$lib/core/interfaces/adapters/IdentificationRepository";
import type { QueryOptions } from "$lib/core/interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import { get_identification_repository } from "$lib/adapters/repositories/InBrowserIdentificationRepository";
import type { IdentificationUseCasesPort } from "$lib/core/interfaces/ports/IdentificationUseCasesPort";

export type IdentificationUseCases = IdentificationUseCasesPort;

export function create_identification_use_cases(
  repository: IdentificationRepository,
): IdentificationUseCases {
  return {
    async create(
      input: CreateIdentificationInput,
    ): AsyncResult<Identification> {
      const validation_errors = validate_identification_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateIdentificationInput,
    ): AsyncResult<Identification> {
      if (!id || id.trim() === "") {
        return create_failure_result("Identification ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Identification not found");
      }

      const merged_input: CreateIdentificationInput = {
        ...existing_result.data,
        ...input,
      };

      const validation_errors = validate_identification_input(merged_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim() === "") {
        return create_failure_result("Identification ID is required");
      }
      return repository.delete_by_id(id);
    },

    async get_by_id(id: string): AsyncResult<Identification> {
      if (!id || id.trim() === "") {
        return create_failure_result("Identification ID is required");
      }
      return repository.find_by_id(id);
    },

    async list(
      filter?: IdentificationFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Identification> {
      const query_options = options || { page_number: 1, page_size: 100 };

      if (!filter) {
        return repository.find_all(query_options);
      }

      const identification_filter: IdentificationFilter = {
        holder_type: filter.holder_type as IdentificationHolderType | undefined,
        holder_id: filter.holder_id,
        identification_type_id: filter.identification_type_id,
        status: filter.status,
      };

      return repository.find_by_filter(identification_filter, query_options);
    },

    async list_by_holder(
      holder_type: IdentificationHolderType,
      holder_id: string,
    ): PaginatedAsyncResult<Identification> {
      return repository.find_by_holder(holder_type, holder_id);
    },

    async list_all(): PaginatedAsyncResult<Identification> {
      return repository.find_all({ page_number: 1, page_size: 1000 });
    },

    async list_identifications_by_entity(
      holder_type: IdentificationHolderType,
      holder_id: string,
    ): PaginatedAsyncResult<Identification> {
      if (!holder_id || holder_id.trim() === "") {
        return create_failure_result("Entity ID is required");
      }
      return repository.find_by_holder(holder_type, holder_id);
    },
  };
}

let identification_use_cases_instance: IdentificationUseCases | null = null;

export function get_identification_use_cases(): IdentificationUseCases {
  if (!identification_use_cases_instance) {
    const repository = get_identification_repository();
    identification_use_cases_instance =
      create_identification_use_cases(repository);
  }
  return identification_use_cases_instance;
}
