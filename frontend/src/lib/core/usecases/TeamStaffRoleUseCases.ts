import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../entities/TeamStaffRole";
import { validate_team_staff_role_input } from "../entities/TeamStaffRole";
import type {
  TeamStaffRoleRepository,
  TeamStaffRoleFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { get_repository_container } from "../../infrastructure/container";
import type { EntityListResult } from "./BaseUseCases";
import type { TeamStaffRoleUseCasesPort } from "../interfaces/ports";

export type TeamStaffRoleUseCases = TeamStaffRoleUseCasesPort;

export function create_team_staff_role_use_cases(
  repository: TeamStaffRoleRepository,
): TeamStaffRoleUseCases {
  return {
    async list(
      filter?: TeamStaffRoleFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<TeamStaffRole>> {
      const query_options = {
        page_number: pagination?.page ?? 1,
        page_size: pagination?.page_size ?? 10,
      };
      const result = await repository.find_all(query_options);
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

    async get_by_id(id: string): AsyncResult<TeamStaffRole> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Staff role ID is required");
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(input: CreateTeamStaffRoleInput): AsyncResult<TeamStaffRole> {
      const validation_errors = validate_team_staff_role_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(
      id: string,
      input: UpdateTeamStaffRoleInput,
    ): AsyncResult<TeamStaffRole> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Staff role ID is required");
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return create_failure_result("Staff role not found");
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Staff role ID is required");
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async list_roles_by_category(
      category: TeamStaffRole["category"],
    ): AsyncResult<TeamStaffRole[]> {
      return await repository.find_by_category(category);
    },
  };
}

export function get_team_staff_role_use_cases(): TeamStaffRoleUseCases {
  const container = get_repository_container();
  return create_team_staff_role_use_cases(container.team_staff_role_repository);
}
