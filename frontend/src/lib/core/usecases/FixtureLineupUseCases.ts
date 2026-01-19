import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../entities/FixtureLineup";
import type {
  FixtureLineupRepository,
  FixtureLineupFilter,
} from "../interfaces/adapters/FixtureLineupRepository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type { FixtureLineupUseCasesPort } from "../interfaces/ports/FixtureLineupUseCasesPort";
import { InMemoryFixtureLineupRepository } from "../../adapters/repositories/InMemoryFixtureLineupRepository";

export type FixtureLineupUseCases = FixtureLineupUseCasesPort;

export function create_fixture_lineup_use_cases(
  repository: FixtureLineupRepository,
): FixtureLineupUseCases {
  return {
    async create(
      input: CreateFixtureLineupInput,
    ): Promise<EntityOperationResult<FixtureLineup>> {
      if (!input.fixture_id?.trim()) {
        return {
          success: false,
          error_message: "Fixture ID is required",
        };
      }

      if (!input.team_id?.trim()) {
        return {
          success: false,
          error_message: "Team ID is required",
        };
      }

      const existing_lineup_result =
        await repository.get_lineup_for_team_in_fixture(
          input.fixture_id,
          input.team_id,
        );

      if (existing_lineup_result.success) {
        return {
          success: false,
          error_message:
            "A lineup already exists for this team in this fixture",
        };
      }

      return repository.create_fixture_lineup(input);
    },

    async get_by_id(id: string): Promise<EntityOperationResult<FixtureLineup>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "FixtureLineup ID is required",
        };
      }
      return repository.get_fixture_lineup_by_id(id);
    },

    async update(
      id: string,
      input: UpdateFixtureLineupInput,
    ): Promise<EntityOperationResult<FixtureLineup>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "FixtureLineup ID is required",
        };
      }

      const existing_result = await repository.get_fixture_lineup_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Lineup not found",
        };
      }

      if (existing_result.data.status === "locked") {
        return {
          success: false,
          error_message: "Cannot update a locked lineup",
        };
      }

      return repository.update_fixture_lineup(id, input);
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "FixtureLineup ID is required",
        };
      }

      const existing_result = await repository.get_fixture_lineup_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Lineup not found",
        };
      }

      if (existing_result.data.status === "locked") {
        return {
          success: false,
          error_message: "Cannot delete a locked lineup",
        };
      }

      return repository.delete_fixture_lineup(id);
    },

    async list(
      filter?: FixtureLineupFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<FixtureLineup>> {
      return repository.find_by_filter(filter, pagination);
    },

    async get_lineups_for_fixture(
      fixture_id: string,
    ): Promise<EntityListResult<FixtureLineup>> {
      return repository.get_lineups_for_fixture(fixture_id);
    },

    async get_lineup_for_team_in_fixture(
      fixture_id: string,
      team_id: string,
    ): Promise<EntityOperationResult<FixtureLineup>> {
      return repository.get_lineup_for_team_in_fixture(fixture_id, team_id);
    },

    async list_lineups_by_fixture(
      fixture_id: string,
      options?: { page: number; page_size: number },
    ): Promise<EntityListResult<FixtureLineup>> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Fixture ID is required",
        };
      }
      return repository.find_by_fixture(fixture_id, options);
    },

    async list_lineups_by_fixture_and_team(
      fixture_id: string,
      team_id: string,
      options?: { page: number; page_size: number },
    ): Promise<EntityListResult<FixtureLineup>> {
      if (!fixture_id || fixture_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Fixture ID is required",
        };
      }
      if (!team_id || team_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Team ID is required",
        };
      }
      return repository.find_by_fixture_and_team(fixture_id, team_id, options);
    },

    async submit_lineup(
      id: string,
    ): Promise<EntityOperationResult<FixtureLineup>> {
      const existing_result = await repository.get_fixture_lineup_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Lineup not found",
        };
      }

      if (existing_result.data.status === "locked") {
        return {
          success: false,
          error_message: "Cannot submit a locked lineup",
        };
      }

      if (existing_result.data.status === "submitted") {
        return {
          success: false,
          error_message: "Lineup is already submitted",
        };
      }

      const player_count = existing_result.data.selected_player_ids.length;
      if (player_count === 0) {
        return {
          success: false,
          error_message: "Cannot submit an empty lineup",
        };
      }

      return repository.update_fixture_lineup(id, {
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
    },

    async lock_lineup(
      id: string,
    ): Promise<EntityOperationResult<FixtureLineup>> {
      const existing_result = await repository.get_fixture_lineup_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return {
          success: false,
          error_message: "Lineup not found",
        };
      }

      if (existing_result.data.status === "locked") {
        return {
          success: false,
          error_message: "Lineup is already locked",
        };
      }

      const player_count = existing_result.data.selected_player_ids.length;
      if (player_count === 0) {
        return {
          success: false,
          error_message: "Cannot lock an empty lineup",
        };
      }

      return repository.update_fixture_lineup(id, {
        status: "locked",
      });
    },
  };
}

let use_cases_instance: FixtureLineupUseCases | null = null;

export function get_fixture_lineup_use_cases(): FixtureLineupUseCases {
  if (!use_cases_instance) {
    const repository = new InMemoryFixtureLineupRepository();
    use_cases_instance = create_fixture_lineup_use_cases(repository);
  }
  return use_cases_instance;
}
