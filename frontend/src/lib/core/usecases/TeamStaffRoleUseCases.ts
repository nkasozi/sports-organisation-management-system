import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../entities/TeamStaffRole";
import { validate_team_staff_role_input } from "../entities/TeamStaffRole";
import type {
  TeamStaffRoleRepository,
  TeamStaffRoleFilter,
} from "../interfaces/adapters/TeamStaffRoleRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { get_team_staff_role_repository } from "../../adapters/repositories/InMemoryTeamStaffRoleRepository";
import type { EntityOperationResult, EntityListResult } from "./BaseUseCases";
import type { TeamStaffRoleUseCasesPort } from "../interfaces/ports/TeamStaffRoleUseCasesPort";

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

    async get_by_id(id: string): Promise<EntityOperationResult<TeamStaffRole>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Staff role ID is required" };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateTeamStaffRoleInput,
    ): Promise<EntityOperationResult<TeamStaffRole>> {
      const validation_errors = validate_team_staff_role_input(input);
      if (validation_errors.length > 0) {
        return { success: false, error_message: validation_errors.join(", ") };
      }

      const result = await repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdateTeamStaffRoleInput,
    ): Promise<EntityOperationResult<TeamStaffRole>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Staff role ID is required" };
      }

      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success) {
        return { success: false, error_message: "Staff role not found" };
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Staff role ID is required" };
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async list_roles_by_category(
      category: TeamStaffRole["category"],
    ): AsyncResult<TeamStaffRole[]> {
      const roles = await repository.find_by_category(category);
      return create_success_result(roles);
    },
  };
}

let use_cases_instance: TeamStaffRoleUseCases | null = null;

export function get_team_staff_role_use_cases(): TeamStaffRoleUseCases {
  if (!use_cases_instance) {
    const repository = get_team_staff_role_repository();
    use_cases_instance = create_team_staff_role_use_cases(repository);
  }
  return use_cases_instance;
}
