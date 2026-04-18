import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
} from "../entities/Venue";
import { validate_venue_input } from "../entities/Venue";
import type { VenueFilter, VenueRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { VenueUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

export type VenueUseCases = VenueUseCasesPort;

export function create_venue_use_cases(
  repository: VenueRepository,
): VenueUseCases {
  return {
    async list(
      filter?: VenueFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Venue> {
      return repository.find_all(filter ?? {}, options ?? {});
    },

    async get_by_id(id: ScalarValueInput<Venue["id"]>): AsyncResult<Venue> {
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

    async update(
      id: ScalarValueInput<Venue["id"]>,
      input: UpdateVenueInput,
    ): AsyncResult<Venue> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Venue ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: ScalarValueInput<Venue["id"]>): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Venue ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_venues(
      ids: Array<ScalarValueInput<Venue["id"]>>,
    ): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one venue ID is required");
      }
      return repository.delete_by_ids(ids);
    },
  };
}
