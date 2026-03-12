import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
} from "../entities/CompetitionTeam";
import { validate_competition_team_input } from "../entities/CompetitionTeam";
import type {
  CompetitionTeamRepository,
  CompetitionTeamFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { get_repository_container } from "../../infrastructure/container";

import type { CompetitionTeamUseCasesPort } from "../interfaces/ports";

export type CompetitionTeamUseCases = CompetitionTeamUseCasesPort;

export function create_competition_team_use_cases(
  repository: CompetitionTeamRepository,
): CompetitionTeamUseCases {
  return {
    async list(
      filter?: CompetitionTeamFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<CompetitionTeam> {
      return repository.find_all(filter, options);
    },

    async get_by_id(id: string): AsyncResult<CompetitionTeam> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition team ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(
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

    async update(
      id: string,
      input: UpdateCompetitionTeamInput,
    ): AsyncResult<CompetitionTeam> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition team ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Competition team ID is required");
      }
      return repository.delete_by_id(id);
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
  const container = get_repository_container();
  return create_competition_team_use_cases(
    container.competition_team_repository,
  );
}
