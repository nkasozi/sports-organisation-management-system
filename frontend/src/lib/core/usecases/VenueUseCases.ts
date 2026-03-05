import type {
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
} from "../entities/Venue";
import type { VenueRepository, VenueFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import type { EntityListResult } from "../entities/BaseEntity";
import type { VenueUseCasesPort } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
import { validate_venue_input } from "../entities/Venue";
import { get_repository_container } from "../../infrastructure/container";

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

    async get_by_id(id: string): AsyncResult<Venue> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Venue ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateVenueInput): AsyncResult<Venue> {
      const validation_errors = validate_venue_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      return repository.create(input);
    },

    async update(id: string, input: UpdateVenueInput): AsyncResult<Venue> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Venue ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Venue ID is required");
      }
      return repository.delete_by_id(id);
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
  const container = get_repository_container();
  return create_venue_use_cases(container.venue_repository);
}
