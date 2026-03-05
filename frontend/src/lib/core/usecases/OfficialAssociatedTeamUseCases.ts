import type {
  OfficialAssociatedTeam,
  CreateOfficialAssociatedTeamInput,
  UpdateOfficialAssociatedTeamInput,
} from "$lib/core/entities/OfficialAssociatedTeam";
import { validate_official_associated_team_input } from "$lib/core/entities/OfficialAssociatedTeam";
import type {
  OfficialAssociatedTeamRepository,
  OfficialAssociatedTeamFilter,
} from "$lib/core/interfaces/ports";
import type { QueryOptions } from "$lib/core/interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { create_failure_result } from "$lib/core/types/Result";
import { get_repository_container } from "../../infrastructure/container";
import type { OfficialAssociatedTeamUseCasesPort } from "$lib/core/interfaces/ports";

export type OfficialAssociatedTeamUseCases = OfficialAssociatedTeamUseCasesPort;

function create_official_associated_team_use_cases(
  repository: OfficialAssociatedTeamRepository,
): OfficialAssociatedTeamUseCases {
  return {
    async create(
      input: CreateOfficialAssociatedTeamInput,
    ): AsyncResult<OfficialAssociatedTeam> {
      const validation_errors = validate_official_associated_team_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateOfficialAssociatedTeamInput,
    ): AsyncResult<OfficialAssociatedTeam> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Official associated team not found");
      }

      const merged_input: CreateOfficialAssociatedTeamInput = {
        ...existing_result.data,
        ...input,
      };

      const validation_errors =
        validate_official_associated_team_input(merged_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      return repository.delete_by_id(id);
    },

    async get_by_id(id: string): AsyncResult<OfficialAssociatedTeam> {
      return repository.find_by_id(id);
    },

    async list(
      filter?: OfficialAssociatedTeamFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<OfficialAssociatedTeam> {
      const query_options = options || { page_number: 1, page_size: 100 };

      if (!filter) {
        return repository.find_all(undefined, query_options);
      }

      const official_associated_team_filter: OfficialAssociatedTeamFilter = {
        official_id: filter.official_id,
        team_id: filter.team_id,
        association_type: filter.association_type,
        status: filter.status,
      };

      return repository.find_all(
        official_associated_team_filter,
        query_options,
      );
    },

    async list_by_official(
      official_id: string,
    ): PaginatedAsyncResult<OfficialAssociatedTeam> {
      return repository.find_by_official(official_id, {
        page_number: 1,
        page_size: 100,
      });
    },

    async list_by_team(
      team_id: string,
    ): PaginatedAsyncResult<OfficialAssociatedTeam> {
      return repository.find_by_team(team_id, {
        page_number: 1,
        page_size: 100,
      });
    },

    async list_all(): PaginatedAsyncResult<OfficialAssociatedTeam> {
      return repository.find_all(undefined, { page_number: 1, page_size: 100 });
    },
  };
}

export function get_official_associated_team_use_cases(): OfficialAssociatedTeamUseCases {
  const container = get_repository_container();
  return create_official_associated_team_use_cases(
    container.official_associated_team_repository,
  );
}
