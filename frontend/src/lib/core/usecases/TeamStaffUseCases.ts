import type {
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
} from "../entities/TeamStaff";
import type { TeamStaffRole } from "../entities/TeamStaffRole";
import type { TeamStaffFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  PaginatedResult,
} from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { validate_team_staff_input } from "../entities/TeamStaff";
import { get_repository_container } from "../../infrastructure/container";
import type { TeamStaffUseCasesPort } from "../interfaces/ports";

export type TeamStaffUseCases = TeamStaffUseCasesPort;

export function create_team_staff_use_cases(
  repository: any,
  roles_repository: any,
): TeamStaffUseCases {
  const staff_repository = repository as any;
  const role_repository = roles_repository as any;

  return {
    async list(
      filter?: TeamStaffFilter,
      pagination?: QueryOptions,
    ): PaginatedAsyncResult<TeamStaff> {
      return staff_repository.find_all(filter, pagination);
    },

    async get_by_id(id: string): AsyncResult<TeamStaff> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team staff ID is required");
      }
      const result = await staff_repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(input: CreateTeamStaffInput): AsyncResult<TeamStaff> {
      const validation_errors = validate_team_staff_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      const result = await staff_repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(
      id: string,
      input: UpdateTeamStaffInput,
    ): AsyncResult<TeamStaff> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team staff ID is required");
      }

      const result = await staff_repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Team staff ID is required");
      }
      const result = await staff_repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async list_staff_by_team(
      team_id: string,
      options?: QueryOptions,
    ): AsyncResult<PaginatedResult<TeamStaff>> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      if (staff_repository.find_by_team) {
        const staff_result = await staff_repository.find_by_team(team_id);
        if (!staff_result.success) {
          return create_failure_result(staff_result.error);
        }
        return create_success_result({
          items: staff_result.data,
          total_count: staff_result.data.length,
          page_number: 1,
          page_size: staff_result.data.length,
          total_pages: 1,
        });
      }
      const fallback = await staff_repository.find_all({ team_id }, options);
      if (!fallback.success) return create_failure_result(fallback.error);
      return create_success_result(fallback.data);
    },

    async list_staff_roles(): AsyncResult<TeamStaffRole[]> {
      const result = await role_repository.find_all(
        { status: "active" },
        { page_size: 100 },
      );

      if (!result.success) {
        return create_failure_result(result.error);
      }

      return create_success_result(result.data.items);
    },
  };
}

export function get_team_staff_use_cases(): TeamStaffUseCases {
  const container = get_repository_container();
  return create_team_staff_use_cases(
    container.team_staff_repository,
    container.team_staff_role_repository,
  );
}
