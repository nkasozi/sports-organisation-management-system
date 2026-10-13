import type {
  CreateTeamStaffRoleInput,
  TeamStaffRole,
  UpdateTeamStaffRoleInput,
} from "../entities/TeamStaffRole";
import { validate_team_staff_role_input } from "../entities/TeamStaffRole";
import type {
  QueryOptions,
  TeamStaffRoleFilter,
  TeamStaffRoleRepository,
  TeamStaffRoleUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
  TeamStaffRoleUseCaseEvent,
  TeamStaffRoleUseCaseMessage,
} from "./TeamStaffRoleUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type TeamStaffRoleUseCases = TeamStaffRoleUseCasesPort;

type TeamStaffRoleId = ScalarValueInput<TeamStaffRole["id"]>;

function fail_missing_role_id(event: string): Result<never, string> {
  return fail_missing_identifier({
    log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message: TeamStaffRoleUseCaseMessage.ID_REQUIRED,
  });
}

async function list_roles(
  repository: TeamStaffRoleRepository,
  filter: TeamStaffRoleFilter | undefined,
  pagination: QueryOptions | undefined,
): PaginatedAsyncResult<TeamStaffRole> {
  return forward_dependency_result(
    await repository.find_all(filter, pagination),
    {
      log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
      event: TeamStaffRoleUseCaseEvent.LIST_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: {},
    },
  );
}

async function get_role_by_id(
  repository: TeamStaffRoleRepository,
  id: TeamStaffRoleId,
): AsyncResult<TeamStaffRole> {
  if (is_blank_identifier(id)) {
    return fail_missing_role_id(TeamStaffRoleUseCaseEvent.GET_ID_MISSING);
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
    event: TeamStaffRoleUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { team_staff_role_id: id },
  });
}

async function create_role(
  repository: TeamStaffRoleRepository,
  input: CreateTeamStaffRoleInput,
): AsyncResult<TeamStaffRole> {
  const validation_errors = validate_team_staff_role_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
        event: TeamStaffRoleUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: { organization_id: input.organization_id },
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
    event: TeamStaffRoleUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { organization_id: input.organization_id },
  });
}

async function update_role(
  repository: TeamStaffRoleRepository,
  id: TeamStaffRoleId,
  input: UpdateTeamStaffRoleInput,
): AsyncResult<TeamStaffRole> {
  if (is_blank_identifier(id)) {
    return fail_missing_role_id(TeamStaffRoleUseCaseEvent.UPDATE_ID_MISSING);
  }
  const existing_result = await repository.find_by_id(id);
  if (!existing_result.success) {
    return forward_dependency_result(existing_result, {
      log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
      event: TeamStaffRoleUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { team_staff_role_id: id },
      user_message: TeamStaffRoleUseCaseMessage.NOT_FOUND,
    });
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
    event: TeamStaffRoleUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_staff_role_id: id },
  });
}

async function delete_role(
  repository: TeamStaffRoleRepository,
  id: TeamStaffRoleId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_role_id(TeamStaffRoleUseCaseEvent.DELETE_ID_MISSING);
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
    event: TeamStaffRoleUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_staff_role_id: id },
  });
}

async function list_roles_by_category(
  repository: TeamStaffRoleRepository,
  category: TeamStaffRole["category"],
): AsyncResult<TeamStaffRole[]> {
  return forward_dependency_result(
    await repository.find_by_category(category),
    {
      log_scope: TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE,
      event: TeamStaffRoleUseCaseEvent.LIST_BY_CATEGORY_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { category },
    },
  );
}

export function create_team_staff_role_use_cases(
  repository: TeamStaffRoleRepository,
): TeamStaffRoleUseCases {
  return {
    list: (filter, pagination) => list_roles(repository, filter, pagination),
    get_by_id: (id) => get_role_by_id(repository, id),
    create: (input) => create_role(repository, input),
    update: (id, input) => update_role(repository, id, input),
    delete: (id) => delete_role(repository, id),
    list_roles_by_category: (category) =>
      list_roles_by_category(repository, category),
  };
}
