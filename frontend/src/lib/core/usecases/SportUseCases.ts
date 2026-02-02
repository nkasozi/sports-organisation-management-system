import type {
  Sport,
  CreateSportInput,
  UpdateSportInput,
} from "../entities/Sport";
import type { AsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type {
  SportRepository,
  SportFilter,
} from "../interfaces/adapters/SportRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import { create_success_result, create_failure_result } from "../types/Result";
import { get_sport_repository } from "../../adapters/repositories/InBrowserSportRepository";
import type { SportUseCasesPort } from "../interfaces/ports/SportUseCasesPort";

export type SportUseCases = SportUseCasesPort;

export function create_sport_use_cases(
  repository: SportRepository,
): SportUseCases {
  return {
    async list(
      filter?: SportFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Sport>> {
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

    async get_by_id(id: string): Promise<EntityOperationResult<Sport>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Sport ID is required",
        };
      }

      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateSportInput,
    ): Promise<EntityOperationResult<Sport>> {
      if (!input.name || input.name.trim().length === 0) {
        return {
          success: false,
          error_message: "Sport name is required",
        };
      }

      const result = await repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdateSportInput,
    ): Promise<EntityOperationResult<Sport>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Sport ID is required",
        };
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Sport ID is required",
        };
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
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

let sport_use_cases_instance: SportUseCases | null = null;

export function get_sport_use_cases(): SportUseCases {
  if (!sport_use_cases_instance) {
    const repository = get_sport_repository();
    sport_use_cases_instance = create_sport_use_cases(repository);
  }
  return sport_use_cases_instance;
}

export function reset_sport_use_cases(): void {
  sport_use_cases_instance = null;
}
