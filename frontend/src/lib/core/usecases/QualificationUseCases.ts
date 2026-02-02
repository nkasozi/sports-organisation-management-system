import type {
  Qualification,
  CreateQualificationInput,
  UpdateQualificationInput,
  QualificationHolderType,
} from "$lib/core/entities/Qualification";
import { validate_qualification_input } from "$lib/core/entities/Qualification";
import type {
  QualificationRepository,
  QualificationFilter,
} from "$lib/core/interfaces/adapters/QualificationRepository";
import type { QueryOptions } from "$lib/core/interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import { get_qualification_repository } from "$lib/adapters/repositories/InBrowserQualificationRepository";
import type { QualificationUseCasesPort } from "$lib/core/interfaces/ports/QualificationUseCasesPort";

export type QualificationUseCases = QualificationUseCasesPort;

function create_qualification_use_cases(
  repository: QualificationRepository,
): QualificationUseCases {
  return {
    async create(input: CreateQualificationInput): AsyncResult<Qualification> {
      const validation_errors = validate_qualification_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateQualificationInput,
    ): AsyncResult<Qualification> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Qualification not found");
      }

      const merged_input: CreateQualificationInput = {
        ...existing_result.data,
        ...input,
      };

      const validation_errors = validate_qualification_input(merged_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      return repository.delete_by_id(id);
    },

    async get_by_id(id: string): AsyncResult<Qualification> {
      return repository.find_by_id(id);
    },

    async list(
      filter?: QualificationFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Qualification> {
      const query_options = options || { page_number: 1, page_size: 100 };

      if (!filter) {
        return repository.find_all(query_options);
      }

      const qualification_filter: QualificationFilter = {
        holder_type: filter.holder_type as QualificationHolderType | undefined,
        holder_id: filter.holder_id,
        certification_level: filter.certification_level,
        status: filter.status,
      };

      return repository.find_by_filter(qualification_filter, query_options);
    },

    async list_by_holder(
      holder_type: QualificationHolderType,
      holder_id: string,
    ): PaginatedAsyncResult<Qualification> {
      return repository.find_by_holder(holder_type, holder_id, {
        page_number: 1,
        page_size: 100,
      });
    },

    async list_all(): PaginatedAsyncResult<Qualification> {
      return repository.find_all({ page_number: 1, page_size: 100 });
    },
  };
}

let use_cases_instance: QualificationUseCases | null = null;

export function get_qualification_use_cases(): QualificationUseCases {
  if (!use_cases_instance) {
    use_cases_instance = create_qualification_use_cases(
      get_qualification_repository(),
    );
  }
  return use_cases_instance;
}
