import type {
  Sport,
  CreateSportInput,
  UpdateSportInput,
} from "../entities/Sport";
import type { AsyncResult } from "../types/Result";
import type { EntityListResult } from "../entities/BaseEntity";
import type { SportRepository, SportFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
import { get_repository_container } from "../../infrastructure/container";
import type { SportUseCasesPort } from "../interfaces/ports";

export type SportUseCases = SportUseCasesPort;

export function create_sport_use_cases(
  repository: SportRepository,
): SportUseCases {
  return {
    async list(
      filter?: SportFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Sport>> {
      const result = await repository.find_all(filter, options);

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

    async get_by_id(id: string): AsyncResult<Sport> {
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

    async update(id: string, input: UpdateSportInput): AsyncResult<Sport> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Sport ID is required");
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Sport ID is required");
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete_sports(ids: string[]): Promise<AsyncResult<number>> {
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

export function get_sport_use_cases(): SportUseCases {
  const container = get_repository_container();
  return create_sport_use_cases(container.sport_repository);
}
