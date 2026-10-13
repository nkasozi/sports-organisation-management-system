import type {
  CreateTeamStaffInput,
  TeamStaff,
  UpdateTeamStaffInput,
} from "../entities/TeamStaff";
import { validate_team_staff_input } from "../entities/TeamStaff";
import type { TeamStaffRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  TEAM_STAFF_USE_CASES_LOG_SCOPE,
  TeamStaffUseCaseEvent,
  TeamStaffUseCaseMessage,
} from "./TeamStaffUseCasesConstants";
import type { TeamStaffId } from "./TeamStaffUseCasesQueries";
import { fail_missing_team_staff_identifier } from "./TeamStaffUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export async function create_team_staff(
  repository: TeamStaffRepository,
  input: CreateTeamStaffInput,
): AsyncResult<TeamStaff> {
  const context = {
    organization_id: input.organization_id,
    team_id: input.team_id,
  };
  const validation_errors = validate_team_staff_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
        event: TeamStaffUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
    event: TeamStaffUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

export async function update_team_staff(
  repository: TeamStaffRepository,
  id: TeamStaffId,
  input: UpdateTeamStaffInput,
): AsyncResult<TeamStaff> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_staff_identifier(
      TeamStaffUseCaseEvent.UPDATE_ID_MISSING,
      TeamStaffUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
    event: TeamStaffUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_staff_id: id },
  });
}

export async function delete_team_staff(
  repository: TeamStaffRepository,
  id: TeamStaffId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_staff_identifier(
      TeamStaffUseCaseEvent.DELETE_ID_MISSING,
      TeamStaffUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: TEAM_STAFF_USE_CASES_LOG_SCOPE,
    event: TeamStaffUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_staff_id: id },
  });
}
