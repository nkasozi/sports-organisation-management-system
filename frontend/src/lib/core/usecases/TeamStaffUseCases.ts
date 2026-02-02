import type {
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
} from "../entities/TeamStaff";
import type { TeamStaffRole } from "../entities/TeamStaffRole";
import type { TeamStaffFilter } from "../interfaces/adapters/TeamStaffRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { validate_team_staff_input } from "../entities/TeamStaff";
import { get_team_staff_repository } from "../../adapters/repositories/InBrowserTeamStaffRepository";
import { get_team_staff_role_repository } from "../../adapters/repositories/InBrowserTeamStaffRoleRepository";
import type { EntityOperationResult, EntityListResult } from "./BaseUseCases";
import type { TeamStaffUseCasesPort } from "../interfaces/ports/TeamStaffUseCasesPort";

export type TeamStaffUseCases = TeamStaffUseCasesPort;

export function create_team_staff_use_cases(
  repository?: any,
  roles_repository?: any,
): TeamStaffUseCases {
  const staff_repository = (repository as any) ?? get_team_staff_repository();
  const role_repository =
    (roles_repository as any) ?? get_team_staff_role_repository();

  return {
    async list(
      filter?: TeamStaffFilter,
      pagination?: { page: number; page_size: number },
    ): Promise<EntityListResult<TeamStaff>> {
      const result = await (staff_repository.find_all
        ? staff_repository.find_all(undefined)
        : staff_repository.find_by_filter({}, undefined));
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

    async get_by_id(id: string): Promise<EntityOperationResult<TeamStaff>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Team staff ID is required" };
      }
      const result = await staff_repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async create(
      input: CreateTeamStaffInput,
    ): Promise<EntityOperationResult<TeamStaff>> {
      const validation_errors = validate_team_staff_input(input);
      if (validation_errors.length > 0) {
        return { success: false, error_message: validation_errors.join(", ") };
      }

      const result = await staff_repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdateTeamStaffInput,
    ): Promise<EntityOperationResult<TeamStaff>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Team staff ID is required" };
      }

      const result = await staff_repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Team staff ID is required" };
      }
      const result = await staff_repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }
      return { success: true, data: result.data };
    },

    async list_staff_by_team(
      team_id: string,
      options?: QueryOptions,
    ): AsyncResult<PaginatedResult<TeamStaff>> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      if (staff_repository.find_by_team) {
        const staff = await staff_repository.find_by_team(team_id);
        return create_success_result({
          items: staff,
          total_count: staff.length,
          page_number: 1,
          page_size: staff.length,
          total_pages: 1,
        });
      }
      const fallback = await staff_repository.find_by_filter(
        { team_id },
        options,
      );
      if (!fallback.success) return create_failure_result(fallback.error);
      return create_success_result(fallback.data);
    },

    async list_staff_roles(): AsyncResult<TeamStaffRole[]> {
      const result = await role_repository.find_all_with_filter(
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

let team_staff_use_cases_instance: TeamStaffUseCases | null = null;

export function get_team_staff_use_cases(): TeamStaffUseCases {
  if (!team_staff_use_cases_instance) {
    team_staff_use_cases_instance = create_team_staff_use_cases();
  }
  return team_staff_use_cases_instance;
}
