import type { CreateTeamInput, Team, UpdateTeamInput } from "../entities/Team";
import { validate_team_input } from "../entities/Team";
import { apply_team_input_defaults } from "../entities/TeamInputDefaults";
import type {
  QueryOptions,
  TeamFilter,
  TeamRepository,
  TeamUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  TEAM_USE_CASES_LOG_SCOPE,
  TeamUseCaseEvent,
  TeamUseCaseMessage,
} from "./TeamUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type TeamUseCases = TeamUseCasesPort;

type TeamId = ScalarValueInput<Team["id"]>;

function fail_missing_team_identifier(
  event: string,
  user_message: string,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: TEAM_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

async function list_teams(
  repository: TeamRepository,
  filter: TeamFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Team> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    log_scope: TEAM_USE_CASES_LOG_SCOPE,
    event: TeamUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

async function get_team_by_id(
  repository: TeamRepository,
  id: TeamId,
): AsyncResult<Team> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_identifier(
      TeamUseCaseEvent.GET_ID_MISSING,
      TeamUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: TEAM_USE_CASES_LOG_SCOPE,
    event: TeamUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { team_id: id },
  });
}

async function create_team(
  repository: TeamRepository,
  submitted_input: CreateTeamInput,
): AsyncResult<Team> {
  const input = apply_team_input_defaults(submitted_input);
  const validation_errors = validate_team_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: TEAM_USE_CASES_LOG_SCOPE,
        event: TeamUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: { organization_id: input.organization_id },
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: TEAM_USE_CASES_LOG_SCOPE,
    event: TeamUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { organization_id: input.organization_id },
  });
}

async function update_team(
  repository: TeamRepository,
  id: TeamId,
  input: UpdateTeamInput,
): AsyncResult<Team> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_identifier(
      TeamUseCaseEvent.UPDATE_ID_MISSING,
      TeamUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: TEAM_USE_CASES_LOG_SCOPE,
    event: TeamUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_id: id },
  });
}

async function delete_team(
  repository: TeamRepository,
  id: TeamId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_identifier(
      TeamUseCaseEvent.DELETE_ID_MISSING,
      TeamUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: TEAM_USE_CASES_LOG_SCOPE,
    event: TeamUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_id: id },
  });
}

async function delete_teams(
  repository: TeamRepository,
  ids: TeamId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_team_identifier(
      TeamUseCaseEvent.BULK_DELETE_IDS_MISSING,
      TeamUseCaseMessage.IDS_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_ids(ids), {
    log_scope: TEAM_USE_CASES_LOG_SCOPE,
    event: TeamUseCaseEvent.BULK_DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { team_ids: ids },
  });
}

async function list_teams_by_organization(
  repository: TeamRepository,
  organization_id: ScalarValueInput<Team["organization_id"]>,
  options: QueryOptions,
): PaginatedAsyncResult<Team> {
  if (is_blank_identifier(organization_id)) {
    return fail_missing_team_identifier(
      TeamUseCaseEvent.LIST_BY_ORGANIZATION_ID_MISSING,
      TeamUseCaseMessage.ORGANIZATION_ID_REQUIRED,
    );
  }
  return forward_dependency_result(
    await repository.find_by_organization(organization_id, options),
    {
      log_scope: TEAM_USE_CASES_LOG_SCOPE,
      event: TeamUseCaseEvent.LIST_BY_ORGANIZATION_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { organization_id },
    },
  );
}

export function create_team_use_cases(
  repository: TeamRepository,
): TeamUseCases {
  return {
    list: (filter, options) =>
      list_teams(repository, filter ?? {}, options ?? {}),
    get_by_id: (id) => get_team_by_id(repository, id),
    create: (input) => create_team(repository, input),
    update: (id, input) => update_team(repository, id, input),
    delete: (id) => delete_team(repository, id),
    delete_teams: (ids) => delete_teams(repository, ids),
    list_teams_by_organization: (organization_id, options) =>
      list_teams_by_organization(repository, organization_id, options ?? {}),
  };
}
