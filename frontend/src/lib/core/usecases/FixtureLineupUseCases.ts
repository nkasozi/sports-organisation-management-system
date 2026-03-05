import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../entities/FixtureLineup";
import type {
  FixtureLineupRepository,
  FixtureLineupFilter,
} from "../interfaces/ports";
import type { EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import type { FixtureLineupUseCasesPort } from "../interfaces/ports";
import { get_repository_container } from "../../infrastructure/container";

export type FixtureLineupUseCases = FixtureLineupUseCasesPort;

export function create_fixture_lineup_use_cases(
  repository: FixtureLineupRepository,
): FixtureLineupUseCases {
  return {
    async create(input: CreateFixtureLineupInput): AsyncResult<FixtureLineup> {
      if (!input.fixture_id?.trim()) {
        return create_failure_result("Fixture ID is required");
      }

      if (!input.team_id?.trim()) {
        return create_failure_result("Team ID is required");
      }

      const existing_lineup_result =
        await repository.get_lineup_for_team_in_fixture(
          input.fixture_id,
          input.team_id,
        );

      if (existing_lineup_result.success) {
        return create_failure_result(
          "A lineup already exists for this team in this fixture",
        );
      }

      return repository.create(input);
    },

    async get_by_id(id: string): AsyncResult<FixtureLineup> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("FixtureLineup ID is required");
      }
      return repository.find_by_id(id);
    },

    async update(
      id: string,
      input: UpdateFixtureLineupInput,
    ): AsyncResult<FixtureLineup> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("FixtureLineup ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Lineup not found");
      }

      if (existing_result.data.status === "locked") {
        return create_failure_result("Cannot update a locked lineup");
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("FixtureLineup ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Lineup not found");
      }

      if (existing_result.data.status === "locked") {
        return create_failure_result("Cannot delete a locked lineup");
      }

      return repository.delete_by_id(id);
    },

    async list(
      filter?: FixtureLineupFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<FixtureLineup>> {
      const result = await repository.find_all(filter, pagination);
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

    async get_lineups_for_fixture(
      fixture_id: string,
    ): Promise<EntityListResult<FixtureLineup>> {
      return repository.get_lineups_for_fixture(fixture_id);
    },

    async get_lineup_for_team_in_fixture(
      fixture_id: string,
      team_id: string,
    ): AsyncResult<FixtureLineup> {
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

    async submit_lineup(id: string): AsyncResult<FixtureLineup> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Lineup not found");
      }

      if (existing_result.data.status === "locked") {
        return create_failure_result("Cannot submit a locked lineup");
      }

      if (existing_result.data.status === "submitted") {
        return create_failure_result("Lineup is already submitted");
      }

      const player_count = existing_result.data.selected_players.length;
      if (player_count === 0) {
        return create_failure_result("Cannot submit an empty lineup");
      }

      return repository.update(id, {
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
    },

    async lock_lineup(id: string): AsyncResult<FixtureLineup> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Lineup not found");
      }

      if (existing_result.data.status === "locked") {
        return create_failure_result("Lineup is already locked");
      }

      const player_count = existing_result.data.selected_players.length;
      if (player_count === 0) {
        return create_failure_result("Cannot lock an empty lineup");
      }

      return repository.update(id, {
        status: "locked",
      });
    },
  };
}

export function get_fixture_lineup_use_cases(): FixtureLineupUseCases {
  const container = get_repository_container();
  return create_fixture_lineup_use_cases(container.fixture_lineup_repository);
}
