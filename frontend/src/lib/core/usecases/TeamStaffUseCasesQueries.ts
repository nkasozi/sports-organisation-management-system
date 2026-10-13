import { ENTITY_STATUS } from "../entities/StatusConstants";
import type { TeamStaff } from "../entities/TeamStaff";
import type { TeamStaffRole } from "../entities/TeamStaffRole";
import type {
  QueryOptions,
  TeamStaffFilter,
  TeamStaffRepository,
  TeamStaffRoleRepository,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  PaginatedResult,
  Result,
} from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  TEAM_STAFF_ROLES_QUERY_OPTIONS,
  TEAM_STAFF_SINGLE_PAGE_NUMBER,
  TEAM_STAFF_USE_CASES_LOG_SCOPE,
  TeamStaffUseCaseEvent,
  TeamStaffUseCaseMessage,
} from "./TeamStaffUseCasesConstants";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type TeamStaffId = ScalarValueInput<TeamStaff["id"]>;

export function fail_missing_team_staff_identifier(
  event: string,
  user_message: string,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

export async function list_team_staff(
  repository: TeamStaffRepository,
  filter: TeamStaffFilter,
  pagination: QueryOptions,
): PaginatedAsyncResult<TeamStaff> {
  return forward_dependency_result(
    await repository.find_all(filter, pagination),
    {
      log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
      event: TeamStaffUseCaseEvent.LIST_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: {},
    },
  );
}

export async function get_team_staff_by_id(
  repository: TeamStaffRepository,
  id: TeamStaffId,
): AsyncResult<TeamStaff> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_staff_identifier(
      TeamStaffUseCaseEvent.GET_ID_MISSING,
      TeamStaffUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
    event: TeamStaffUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { team_staff_id: id },
  });
}

function to_single_page(items: TeamStaff[]): PaginatedResult<TeamStaff> {
  return {
    items,
    total_count: items.length,
    page_number: TEAM_STAFF_SINGLE_PAGE_NUMBER,
    page_size: items.length,
    total_pages: TEAM_STAFF_SINGLE_PAGE_NUMBER,
  };
}

export async function list_staff_by_team(
  repository: TeamStaffRepository,
  team_id: ScalarValueInput<TeamStaff["team_id"]>,
): AsyncResult<PaginatedResult<TeamStaff>> {
  if (is_blank_identifier(team_id)) {
    return fail_missing_team_staff_identifier(
      TeamStaffUseCaseEvent.LIST_BY_TEAM_ID_MISSING,
      TeamStaffUseCaseMessage.TEAM_ID_REQUIRED,
    );
  }
  const staff_result = forward_dependency_result(
    await repository.find_by_team(team_id),
    {
      log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
      event: TeamStaffUseCaseEvent.LIST_BY_TEAM_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { team_id },
    },
  );
  if (!staff_result.success) {
    return staff_result;
  }
  return create_success_result(to_single_page(staff_result.data));
}

export async function list_staff_roles(
  role_repository: TeamStaffRoleRepository,
): AsyncResult<TeamStaffRole[]> {
  const roles_result = forward_dependency_result(
    await role_repository.find_all(
      { status: ENTITY_STATUS.ACTIVE },
      TEAM_STAFF_ROLES_QUERY_OPTIONS,
    ),
    {
      log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
      event: TeamStaffUseCaseEvent.LIST_ROLES_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: {},
    },
  );
  if (!roles_result.success) {
    return roles_result;
  }
  return create_success_result(roles_result.data.items);
}
