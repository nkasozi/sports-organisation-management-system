import type {
  CreateJerseyColorInput,
  JerseyColor,
  JerseyColorHolderType,
  UpdateJerseyColorInput,
} from "$lib/core/entities/JerseyColor";
import { validate_jersey_color_input } from "$lib/core/entities/JerseyColor";
import type {
  JerseyColorFilter,
  JerseyColorRepository,
} from "$lib/core/interfaces/ports";
import type { QueryOptions } from "$lib/core/interfaces/ports";
import type { JerseyColorUseCasesPort } from "$lib/core/interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { create_failure_result } from "$lib/core/types/Result";

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
      id: JerseyColor["id"],
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

    async delete(id: JerseyColor["id"]): AsyncResult<boolean> {
      if (!id || id.trim() === "") {
        return create_failure_result("Jersey Color ID is required");
      }
      return repository.delete_by_id(id);
    },

    async get_by_id(id: JerseyColor["id"]): AsyncResult<JerseyColor> {
      if (!id || id.trim() === "") {
        return create_failure_result("Jersey Color ID is required");
      }
      return repository.find_by_id(id);
    },

    async list(
      filter?: JerseyColorFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<JerseyColor> {
      if (!filter) {
        return repository.find_all({}, options);
      }

      const typed_filter: JerseyColorFilter = {
        ...(filter.holder_type
          ? { holder_type: filter.holder_type as JerseyColorHolderType }
          : {}),
        ...(filter.holder_id
          ? { holder_id: filter.holder_id as JerseyColorFilter["holder_id"] }
          : {}),
        ...(filter.nickname
          ? { nickname: filter.nickname as JerseyColorFilter["nickname"] }
          : {}),
        ...(filter.main_color
          ? { main_color: filter.main_color as JerseyColorFilter["main_color"] }
          : {}),
        ...(filter.status
          ? { status: filter.status as JerseyColorFilter["status"] }
          : {}),
      };

      return repository.find_all(typed_filter, options);
    },

    async list_by_holder(
      holder_type: JerseyColorHolderType,
      holder_id: JerseyColor["holder_id"],
    ): PaginatedAsyncResult<JerseyColor> {
      return repository.find_by_holder(holder_type, holder_id);
    },

    async list_all(): PaginatedAsyncResult<JerseyColor> {
      return repository.find_all({}, { page_size: 1000 });
    },

    async list_jerseys_by_entity(
      holder_type: JerseyColorHolderType,
      holder_id: JerseyColor["holder_id"],
    ): PaginatedAsyncResult<JerseyColor> {
      if (!holder_id || holder_id.trim() === "") {
        return create_failure_result("Holder ID is required");
      }
      return repository.find_by_holder(holder_type, holder_id);
    },
  };
}
