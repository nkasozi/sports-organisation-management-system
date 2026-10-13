import type {
  CreateTeamProfileInput,
  TeamProfile,
  UpdateTeamProfileInput,
} from "$lib/core/entities/TeamProfile";
import { validate_team_profile_input } from "$lib/core/entities/TeamProfile";
import type { TeamProfileRepository } from "$lib/core/interfaces/ports";
import type { AsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  TEAM_PROFILE_USE_CASES_LOG_SCOPE,
  TeamProfileUseCaseEvent,
  TeamProfileUseCaseMessage,
} from "./TeamProfileUseCasesConstants";
import {
  fail_missing_team_profile_identifier,
  type TeamProfileId,
} from "./TeamProfileUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export async function create_team_profile(
  repository: TeamProfileRepository,
  input: CreateTeamProfileInput,
): AsyncResult<TeamProfile> {
  const context = { team_id: input.team_id };
  const validation = validate_team_profile_input(input);
  if (!validation.is_valid) {
    return fail_validation(
      {
        log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
        event: TeamProfileUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      },
      Object.values(validation.errors),
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event: TeamProfileUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

export async function update_team_profile(
  repository: TeamProfileRepository,
  id: TeamProfileId,
  input: UpdateTeamProfileInput,
): AsyncResult<TeamProfile> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_profile_identifier(
      TeamProfileUseCaseEvent.UPDATE_ID_MISSING,
      TeamProfileUseCaseMessage.ID_REQUIRED,
    );
  }
  const validation = validate_team_profile_input(input);
  if (!validation.is_valid) {
    return fail_validation(
      {
        log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
        event: TeamProfileUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context: { team_profile_id: id },
      },
      Object.values(validation.errors),
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event: TeamProfileUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_profile_id: id },
  });
}

export async function delete_team_profile(
  repository: TeamProfileRepository,
  id: TeamProfileId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_profile_identifier(
      TeamProfileUseCaseEvent.DELETE_ID_MISSING,
      TeamProfileUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event: TeamProfileUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_profile_id: id },
  });
}
