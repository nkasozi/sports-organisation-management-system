import type {
  CreateSportInput,
  Sport,
  UpdateSportInput,
} from "../entities/Sport";
import type { SportFilter, SportRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { SportUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

export type SportUseCases = SportUseCasesPort;

export function create_sport_use_cases(
  repository: SportRepository,
): SportUseCases {
  return {
    async list(
      filter?: SportFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Sport> {
      return repository.find_all(filter, options);
    },

    async get_by_id(id: ScalarValueInput<Sport["id"]>): AsyncResult<Sport> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Sport ID is required");
      }

      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(input: CreateSportInput): AsyncResult<Sport> {
      if (!input.name || input.name.trim().length === 0) {
        return create_failure_result("Sport name is required");
      }

      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(
      id: ScalarValueInput<Sport["id"]>,
      input: UpdateSportInput,
    ): AsyncResult<Sport> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Sport ID is required");
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: ScalarValueInput<Sport["id"]>): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Sport ID is required");
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete_sports(
      ids: Array<ScalarValueInput<Sport["id"]>>,
    ): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one sport ID is required");
      }

      const result = await repository.delete_by_ids(ids);
      if (!result.success) {
        return create_failure_result(result.error || "Failed to delete sports");
      }
      return create_success_result(result.data || 0);
    },
  };
}
