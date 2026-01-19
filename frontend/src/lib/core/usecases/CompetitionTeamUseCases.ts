import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
} from "../entities/CompetitionTeam";
import { validate_competition_team_input } from "../entities/CompetitionTeam";
import type {
  CompetitionTeamRepository,
  CompetitionTeamFilter,
} from "../interfaces/adapters/CompetitionTeamRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import { get_competition_team_repository } from "../../adapters/repositories/InMemoryCompetitionTeamRepository";
import type { EntityOperationResult, EntityListResult } from "./BaseUseCases";
import type { CompetitionTeamUseCasesPort } from "../interfaces/ports/CompetitionTeamUseCasesPort";

export type CompetitionTeamUseCases = CompetitionTeamUseCasesPort;

export function create_competition_team_use_cases(
  repository: CompetitionTeamRepository,
): CompetitionTeamUseCases {
  return {
    async list(
      filter?: CompetitionTeamFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<CompetitionTeam>> {
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

    async get_by_id(
      id: string,
    ): Promise<EntityOperationResult<CompetitionTeam>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Competition team ID is required",
        };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateCompetitionTeamInput,
    ): Promise<EntityOperationResult<CompetitionTeam>> {
      const validation_errors = validate_competition_team_input(input);
      if (validation_errors.length > 0) {
        return { success: false, error_message: validation_errors.join(", ") };
      }

      const existing = await repository.find_team_in_competition(
        input.competition_id,
        input.team_id,
      );
      if (existing.success) {
        return {
          success: false,
          error_message: "Team is already registered in this competition",
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
      input: UpdateCompetitionTeamInput,
    ): Promise<EntityOperationResult<CompetitionTeam>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Competition team ID is required",
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
          error_message: "Competition team ID is required",
        };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async add_team_to_competition(
      input: CreateCompetitionTeamInput,
    ): AsyncResult<CompetitionTeam> {
      const validation_errors = validate_competition_team_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      const existing = await repository.find_team_in_competition(
        input.competition_id,
        input.team_id,
      );
      if (existing.success) {
        return create_failure_result(
          "Team is already registered in this competition",
        );
      }

      return repository.create(input);
    },

    async remove_team_from_competition(
      competition_id: string,
      team_id: string,
    ): AsyncResult<boolean> {
      if (!competition_id || competition_id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.remove_team_from_competition(competition_id, team_id);
    },

    async list_teams_in_competition(
      competition_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<CompetitionTeam> {
      if (!competition_id || competition_id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.find_by_competition(competition_id, options);
    },

    async list_competitions_for_team(
      team_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<CompetitionTeam> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.find_by_team(team_id, options);
    },

    async is_team_in_competition(
      competition_id: string,
      team_id: string,
    ): AsyncResult<CompetitionTeam> {
      if (!competition_id || !team_id) {
        return create_failure_result(
          "Both competition ID and team ID are required",
        );
      }
      return repository.find_team_in_competition(competition_id, team_id);
    },
  };
}

export function get_competition_team_use_cases(): CompetitionTeamUseCases {
  const repository = get_competition_team_repository();
  return create_competition_team_use_cases(repository);
}
