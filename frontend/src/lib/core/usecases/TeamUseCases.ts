import type { Team, CreateTeamInput, UpdateTeamInput } from "../entities/Team";
import type { TeamRepository, TeamFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import type { TeamUseCasesPort } from "../interfaces/ports";
import { create_success_result, create_failure_result } from "../types/Result";
import { validate_team_input } from "../entities/Team";
import { get_repository_container } from "../../infrastructure/container";

export type TeamUseCases = TeamUseCasesPort;

export function create_team_use_cases(
  repository: TeamRepository,
): TeamUseCases {
  return {
    async list(
      filter?: TeamFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Team> {
      return repository.find_all(filter, options);
    },

    async get_by_id(id: string): AsyncResult<Team> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateTeamInput): AsyncResult<Team> {
      const validation_errors = validate_team_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      return repository.create(input);
    },

    async update(id: string, input: UpdateTeamInput): AsyncResult<Team> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_teams(ids: string[]): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one team ID is required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_teams_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Team> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },
  };
}

export function get_team_use_cases(): TeamUseCases {
  const container = get_repository_container();
  return create_team_use_cases(container.team_repository);
}
