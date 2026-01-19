import type {
  FixtureOfficial,
  CreateFixtureOfficialInput,
  UpdateFixtureOfficialInput,
} from "../entities/FixtureOfficial";
import type {
  FixtureOfficialRepository,
  FixtureOfficialFilter,
} from "../interfaces/adapters/FixtureOfficialRepository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import { InMemoryFixtureOfficialRepository } from "../../adapters/repositories/InMemoryFixtureOfficialRepository";

export interface FixtureOfficialUseCases {
  create(
    input: CreateFixtureOfficialInput,
  ): Promise<EntityOperationResult<FixtureOfficial>>;
  get_by_id(id: string): Promise<EntityOperationResult<FixtureOfficial>>;
  update(
    id: string,
    input: UpdateFixtureOfficialInput,
  ): Promise<EntityOperationResult<FixtureOfficial>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
  list(
    filter?: FixtureOfficialFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureOfficial>>;
  list_officials_for_fixture(
    fixture_id: string,
  ): Promise<EntityListResult<FixtureOfficial>>;
  list_fixtures_for_official(
    official_id: string,
  ): Promise<EntityListResult<FixtureOfficial>>;
  confirm_assignment(
    id: string,
  ): Promise<EntityOperationResult<FixtureOfficial>>;
  decline_assignment(
    id: string,
  ): Promise<EntityOperationResult<FixtureOfficial>>;
}

export function create_fixture_official_use_cases(
  repository: FixtureOfficialRepository,
): FixtureOfficialUseCases {
  return {
    async create(
      input: CreateFixtureOfficialInput,
    ): Promise<EntityOperationResult<FixtureOfficial>> {
      if (!input.fixture_id?.trim()) {
        return {
          success: false,
          error_message: "Fixture ID is required",
        };
      }

      if (!input.official_id?.trim()) {
        return {
          success: false,
          error_message: "Official ID is required",
        };
      }

      if (!input.role_id?.trim()) {
        return {
          success: false,
          error_message: "Role ID is required",
        };
      }

      const role_already_assigned = await repository.find_by_filter({
        fixture_id: input.fixture_id,
        role_id: input.role_id,
      });

      if (
        role_already_assigned.success &&
        role_already_assigned.data.length > 0
      ) {
        return {
          success: false,
          error_message:
            "This role is already assigned to another official for this fixture",
        };
      }

      const existing_assignment =
        await repository.get_official_assignment_for_fixture(
          input.fixture_id,
          input.official_id,
        );

      if (existing_assignment.success) {
        return {
          success: false,
          error_message: "This official is already assigned to this fixture",
        };
      }

      return repository.create_fixture_official(input);
    },

    async get_by_id(
      id: string,
    ): Promise<EntityOperationResult<FixtureOfficial>> {
      if (!id?.trim()) {
        return {
          success: false,
          error_message: "FixtureOfficial ID is required",
        };
      }

      return repository.get_fixture_official_by_id(id);
    },

    async update(
      id: string,
      input: UpdateFixtureOfficialInput,
    ): Promise<EntityOperationResult<FixtureOfficial>> {
      if (!id?.trim()) {
        return {
          success: false,
          error_message: "FixtureOfficial ID is required",
        };
      }

      const existing_result = await repository.get_fixture_official_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Fixture official assignment not found",
        };
      }

      const existing_assignment = existing_result.data;

      if (input.role_id && input.role_id !== existing_assignment.role_id) {
        const fixture_id = existing_assignment.fixture_id;
        const role_already_assigned = await repository.find_by_filter({
          fixture_id,
          role_id: input.role_id,
        });

        if (
          role_already_assigned.success &&
          role_already_assigned.data.length > 0 &&
          role_already_assigned.data[0].id !== id
        ) {
          return {
            success: false,
            error_message:
              "This role is already assigned to another official for this fixture",
          };
        }
      }

      return repository.update_fixture_official(id, input);
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id?.trim()) {
        return {
          success: false,
          error_message: "FixtureOfficial ID is required",
        };
      }

      const existing_result = await repository.get_fixture_official_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Fixture official assignment not found",
        };
      }

      return repository.delete_fixture_official(id);
    },

    async list(
      filter?: FixtureOfficialFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<FixtureOfficial>> {
      return repository.find_by_filter(
        filter,
        pagination ?? { page: 1, page_size: 50 },
      );
    },

    async list_officials_for_fixture(
      fixture_id: string,
    ): Promise<EntityListResult<FixtureOfficial>> {
      if (!fixture_id?.trim()) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Fixture ID is required",
        };
      }

      return repository.get_officials_for_fixture(fixture_id);
    },

    async list_fixtures_for_official(
      official_id: string,
    ): Promise<EntityListResult<FixtureOfficial>> {
      if (!official_id?.trim()) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Official ID is required",
        };
      }

      return repository.get_fixtures_for_official(official_id);
    },

    async confirm_assignment(
      id: string,
    ): Promise<EntityOperationResult<FixtureOfficial>> {
      if (!id?.trim()) {
        return {
          success: false,
          error_message: "FixtureOfficial ID is required",
        };
      }

      const existing_result = await repository.get_fixture_official_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Fixture official assignment not found",
        };
      }

      return repository.update_fixture_official(id, {
        confirmation_status: "confirmed",
      });
    },

    async decline_assignment(
      id: string,
    ): Promise<EntityOperationResult<FixtureOfficial>> {
      if (!id?.trim()) {
        return {
          success: false,
          error_message: "FixtureOfficial ID is required",
        };
      }

      const existing_result = await repository.get_fixture_official_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Fixture official assignment not found",
        };
      }

      return repository.update_fixture_official(id, {
        confirmation_status: "declined",
      });
    },
  };
}

let use_cases_instance: FixtureOfficialUseCases | null = null;

export function get_fixture_official_use_cases(): FixtureOfficialUseCases {
  if (!use_cases_instance) {
    const repository = new InMemoryFixtureOfficialRepository();
    use_cases_instance = create_fixture_official_use_cases(repository);
  }
  return use_cases_instance;
}
