import type {
  Gender,
  CreateGenderInput,
  UpdateGenderInput,
} from "$lib/core/entities/Gender";
import { validate_gender_input } from "$lib/core/entities/Gender";
import type {
  GenderRepository,
  GenderFilter,
} from "$lib/core/interfaces/adapters/GenderRepository";
import type { QueryOptions } from "$lib/core/interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import { get_gender_repository } from "$lib/adapters/repositories/InBrowserGenderRepository";
import type { GenderUseCasesPort } from "$lib/core/interfaces/ports/GenderUseCasesPort";

export type GenderUseCases = GenderUseCasesPort;

export function create_gender_use_cases(
  repository: GenderRepository,
): GenderUseCases {
  return {
    async create(input: CreateGenderInput): AsyncResult<Gender> {
      const validation_errors = validate_gender_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(id: string, input: UpdateGenderInput): AsyncResult<Gender> {
      if (!id || id.trim() === "") {
        return create_failure_result("Gender ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Gender not found");
      }

      const merged_input: CreateGenderInput = {
        ...existing_result.data,
        ...input,
      };

      const validation_errors = validate_gender_input(merged_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim() === "") {
        return create_failure_result("Gender ID is required");
      }
      return repository.delete_by_id(id);
    },

    async get_by_id(id: string): AsyncResult<Gender> {
      if (!id || id.trim() === "") {
        return create_failure_result("Gender ID is required");
      }
      return repository.find_by_id(id);
    },

    async list(
      filter?: GenderFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Gender> {
      const query_options = options || { page_number: 1, page_size: 100 };

      if (!filter) {
        return repository.find_all(query_options);
      }

      const gender_filter: GenderFilter = {
        status: filter.status,
      };

      return repository.find_by_filter(gender_filter, query_options);
    },

    async list_all(): PaginatedAsyncResult<Gender> {
      return repository.find_all({ page_number: 1, page_size: 1000 });
    },
  };
}

let gender_use_cases_instance: GenderUseCases | null = null;

export function get_gender_use_cases(): GenderUseCases {
  if (!gender_use_cases_instance) {
    const repository = get_gender_repository();
    gender_use_cases_instance = create_gender_use_cases(repository);
  }
  return gender_use_cases_instance;
}
