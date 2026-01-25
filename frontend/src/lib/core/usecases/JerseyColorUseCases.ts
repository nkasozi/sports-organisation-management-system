import type {
  JerseyColor,
  CreateJerseyColorInput,
  UpdateJerseyColorInput,
  JerseyColorHolderType,
} from "$lib/core/entities/JerseyColor";
import { validate_jersey_color_input } from "$lib/core/entities/JerseyColor";
import type {
  JerseyColorRepository,
  JerseyColorFilter,
} from "$lib/core/interfaces/adapters/JerseyColorRepository";
import type { QueryOptions } from "$lib/core/interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import { get_jersey_color_repository } from "$lib/adapters/repositories/InMemoryJerseyColorRepository";
import type { JerseyColorUseCasesPort } from "$lib/core/interfaces/ports/JerseyColorUseCasesPort";

export type JerseyColorUseCases = JerseyColorUseCasesPort;

export function create_jersey_color_use_cases(
  repository: JerseyColorRepository,
): JerseyColorUseCases {
  return {
    async create(input: CreateJerseyColorInput): AsyncResult<JerseyColor> {
      const validation_errors = validate_jersey_color_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateJerseyColorInput,
    ): AsyncResult<JerseyColor> {
      if (!id || id.trim() === "") {
        return create_failure_result("Jersey Color ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Jersey Color not found");
      }

      const merged_input: CreateJerseyColorInput = {
        ...existing_result.data,
        ...input,
      };

      const validation_errors = validate_jersey_color_input(merged_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim() === "") {
        return create_failure_result("Jersey Color ID is required");
      }
      return repository.delete_by_id(id);
    },

    async get_by_id(id: string): AsyncResult<JerseyColor> {
      if (!id || id.trim() === "") {
        return create_failure_result("Jersey Color ID is required");
      }
      return repository.find_by_id(id);
    },

    async list(
      filter?: JerseyColorFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<JerseyColor> {
      const typed_filter: JerseyColorFilter = {
        holder_type: filter?.holder_type as JerseyColorHolderType | undefined,
        holder_id: filter?.holder_id,
        nickname: filter?.nickname,
        main_color: filter?.main_color,
        status: filter?.status,
      };

      return repository.find_by_filter(typed_filter, options);
    },

    async list_by_holder(
      holder_type: JerseyColorHolderType,
      holder_id: string,
    ): PaginatedAsyncResult<JerseyColor> {
      return repository.find_by_holder(holder_type, holder_id);
    },

    async list_all(): PaginatedAsyncResult<JerseyColor> {
      return repository.find_all({ page_size: 1000 });
    },

    async list_jerseys_by_entity(
      holder_type: JerseyColorHolderType,
      holder_id: string,
    ): PaginatedAsyncResult<JerseyColor> {
      if (!holder_id || holder_id.trim() === "") {
        return create_failure_result("Holder ID is required");
      }
      return repository.find_by_holder(holder_type, holder_id);
    },
  };
}

let use_cases_instance: JerseyColorUseCases | null = null;

export function get_jersey_color_use_cases(): JerseyColorUseCases {
  if (!use_cases_instance) {
    const repository = get_jersey_color_repository();
    use_cases_instance = create_jersey_color_use_cases(repository);
  }
  return use_cases_instance;
}
