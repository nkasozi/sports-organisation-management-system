import type { CreateTeamInput, Team, UpdateTeamInput } from "../entities/Team";
import { validate_team_input } from "../entities/Team";
import type { TeamFilter, TeamRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { TeamUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

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

    async get_by_id(id: ScalarValueInput<Team["id"]>): AsyncResult<Team> {
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

    async update(
      id: ScalarValueInput<Team["id"]>,
      input: UpdateTeamInput,
    ): AsyncResult<Team> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.update(id, input);
    },

    async delete(id: ScalarValueInput<Team["id"]>): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_teams(
      ids: Array<ScalarValueInput<Team["id"]>>,
    ): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one team ID is required");
      }
      return repository.delete_by_ids(ids);
    },

    async list_teams_by_organization(
      organization_id: ScalarValueInput<Team["organization_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Team> {
      if (!organization_id || organization_id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_organization(organization_id, options);
    },
  };
}
