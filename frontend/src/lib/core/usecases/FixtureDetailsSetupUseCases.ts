import type {
  FixtureDetailsSetup,
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
} from "../entities/FixtureDetailsSetup";
import { validate_fixture_details_setup_input } from "../entities/FixtureDetailsSetup";
import type {
  FixtureDetailsSetupRepository,
  FixtureDetailsSetupFilter,
} from "../interfaces/adapters/FixtureDetailsSetupRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { get_fixture_details_setup_repository } from "../../adapters/repositories/InMemoryFixtureDetailsSetupRepository";
import type { FixtureDetailsSetupUseCasesPort } from "../interfaces/ports/FixtureDetailsSetupUseCasesPort";

export type FixtureDetailsSetupUseCases = FixtureDetailsSetupUseCasesPort;

export function create_fixture_details_setup_use_cases(
  repository: FixtureDetailsSetupRepository,
): FixtureDetailsSetupUseCases {
  return {
    async create(
      input: CreateFixtureDetailsSetupInput,
    ): AsyncResult<FixtureDetailsSetup> {
      const validation = validate_fixture_details_setup_input(input);
      if (!validation.is_valid) {
        const first_error = Object.values(validation.errors)[0];
        return create_failure_result(first_error || "Validation failed");
      }

      const existing_setups = await repository.find_by_filter(
        {
          fixture_id: input.fixture_id,
        },
        { page_number: 1, page_size: 1 },
      );

      if (existing_setups.success && existing_setups.data.items.length > 0) {
        return create_failure_result(
          "A fixture details setup already exists for this fixture. Please edit the existing setup instead.",
        );
      }

      return repository.create(input);
    },

    async get_by_id(id: string): AsyncResult<FixtureDetailsSetup> {
      if (!id?.trim()) {
        return create_failure_result("Fixture Details Setup ID is required");
      }
      return repository.find_by_id(id);
    },

    async update(
      id: string,
      input: UpdateFixtureDetailsSetupInput,
    ): AsyncResult<FixtureDetailsSetup> {
      if (!id?.trim()) {
        return create_failure_result("Fixture Details Setup ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result(
          "Fixture details setup assignment not found",
        );
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id?.trim()) {
        return create_failure_result("Fixture Details Setup ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result(
          "Fixture details setup assignment not found",
        );
      }

      return repository.delete_by_id(id);
    },

    async list(
      filter?: FixtureDetailsSetupFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<FixtureDetailsSetup> {
      return repository.find_by_filter(filter || {}, {
        page_number: options?.page_number || 1,
        page_size: options?.page_size || 50,
      });
    },

    async list_by_fixture(
      fixture_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<FixtureDetailsSetup> {
      if (!fixture_id?.trim()) {
        return create_failure_result("Fixture ID is required");
      }
      return repository.find_by_fixture(fixture_id, options);
    },

    async list_by_official(
      official_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<FixtureDetailsSetup> {
      if (!official_id?.trim()) {
        return create_failure_result("Official ID is required");
      }
      return repository.find_by_official(official_id, options);
    },

    async confirm_assignment(id: string): AsyncResult<FixtureDetailsSetup> {
      if (!id?.trim()) {
        return create_failure_result("Fixture Details Setup ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result(
          "Fixture details setup assignment not found",
        );
      }

      return repository.update(id, {
        confirmation_status: "confirmed",
      });
    },

    async decline_assignment(id: string): AsyncResult<FixtureDetailsSetup> {
      if (!id?.trim()) {
        return create_failure_result("Fixture Details Setup ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result(
          "Fixture details setup assignment not found",
        );
      }

      return repository.update(id, {
        confirmation_status: "declined",
      });
    },
  };
}

let use_cases_instance: FixtureDetailsSetupUseCases | null = null;

export function get_fixture_details_setup_use_cases(): FixtureDetailsSetupUseCases {
  if (!use_cases_instance) {
    const repository = get_fixture_details_setup_repository();
    use_cases_instance = create_fixture_details_setup_use_cases(repository);
  }
  return use_cases_instance;
}
