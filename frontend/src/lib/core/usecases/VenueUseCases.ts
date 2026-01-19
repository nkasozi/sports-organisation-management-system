import type {
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
} from "../entities/Venue";
import type {
  VenueRepository,
  VenueFilter,
} from "../interfaces/adapters/VenueRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { VenueUseCasesPort } from "../interfaces/ports/VenueUseCasesPort";
import { create_failure_result } from "../types/Result";
import { validate_venue_input } from "../entities/Venue";
import { get_venue_repository } from "../../adapters/repositories/InMemoryVenueRepository";

export type VenueUseCases = VenueUseCasesPort;

export function create_venue_use_cases(
  repository: VenueRepository,
): VenueUseCases {
  return {
    async list(
      filter?: VenueFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Venue>> {
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

    async get_by_id(id: string): Promise<EntityOperationResult<Venue>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Venue ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateVenueInput,
    ): Promise<EntityOperationResult<Venue>> {
      const validation_errors = validate_venue_input(input);
      if (validation_errors.length > 0) {
        return { success: false, error_message: validation_errors.join(", ") };
      }
      const result = await repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdateVenueInput,
    ): Promise<EntityOperationResult<Venue>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Venue ID is required" };
      }
      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Venue ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete_venues(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one venue ID is required");
      }
      return repository.delete_by_ids(ids);
    },
  };
}

export function get_venue_use_cases(): VenueUseCases {
  return create_venue_use_cases(get_venue_repository());
}
