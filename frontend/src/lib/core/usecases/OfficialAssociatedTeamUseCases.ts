import type {
  CreateOfficialAssociatedTeamInput,
  OfficialAssociatedTeam,
  UpdateOfficialAssociatedTeamInput,
} from "$lib/core/entities/OfficialAssociatedTeam";
import { validate_official_associated_team_input } from "$lib/core/entities/OfficialAssociatedTeam";
import type {
  OfficialAssociatedTeamRepository,
  OfficialAssociatedTeamUseCasesPort,
} from "$lib/core/interfaces/ports";
import type { AsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  OFFICIAL_ASSOCIATED_TEAM_DEFAULT_QUERY_OPTIONS,
  OfficialAssociatedTeamUseCaseEvent,
  OfficialAssociatedTeamUseCaseMessage,
} from "./OfficialAssociatedTeamUseCasesConstants";
import type { OfficialAssociatedTeamId } from "./OfficialAssociatedTeamUseCasesQueries";
import {
  build_official_associated_team_filter,
  build_target,
  get_official_associated_team_by_id,
  list_by_official,
  list_by_team,
  list_official_associated_teams,
} from "./OfficialAssociatedTeamUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
} from "./UseCaseResultGuards";

export type OfficialAssociatedTeamUseCases = OfficialAssociatedTeamUseCasesPort;

async function create_official_associated_team(
  repository: OfficialAssociatedTeamRepository,
  input: CreateOfficialAssociatedTeamInput,
): AsyncResult<OfficialAssociatedTeam> {
  const context = { official_id: input.official_id, team_id: input.team_id };
  const validation_errors = validate_official_associated_team_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_target(
        OfficialAssociatedTeamUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      ),
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    ...build_target(OfficialAssociatedTeamUseCaseEvent.CREATE_FAILED, context),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function update_official_associated_team(
  repository: OfficialAssociatedTeamRepository,
  id: OfficialAssociatedTeamId,
  input: UpdateOfficialAssociatedTeamInput,
): AsyncResult<OfficialAssociatedTeam> {
  const context = { official_associated_team_id: id };
  const existing_result = await repository.find_by_id(id);
  if (!existing_result.success) {
    return forward_dependency_result(existing_result, {
      ...build_target(
        OfficialAssociatedTeamUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
        context,
      ),
      code: UseCaseErrorCode.NOT_FOUND,
      user_message: OfficialAssociatedTeamUseCaseMessage.NOT_FOUND,
    });
  }
  const merged_input: CreateOfficialAssociatedTeamInput = {
    ...existing_result.data,
    ...input,
  };
  const validation_errors =
    validate_official_associated_team_input(merged_input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_target(
        OfficialAssociatedTeamUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context,
      ),
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    ...build_target(OfficialAssociatedTeamUseCaseEvent.UPDATE_FAILED, context),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_official_associated_team(
  repository: OfficialAssociatedTeamRepository,
  id: OfficialAssociatedTeamId,
): AsyncResult<boolean> {
  return forward_dependency_result(await repository.delete_by_id(id), {
    ...build_target(OfficialAssociatedTeamUseCaseEvent.DELETE_FAILED, {
      official_associated_team_id: id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export function create_official_associated_team_use_cases(
  repository: OfficialAssociatedTeamRepository,
): OfficialAssociatedTeamUseCases {
  return {
    create: (input) => create_official_associated_team(repository, input),
    update: (id, input) =>
      update_official_associated_team(repository, id, input),
    delete: (id) => delete_official_associated_team(repository, id),
    get_by_id: (id) => get_official_associated_team_by_id(repository, id),
    list: (filter, options) =>
      list_official_associated_teams(
        repository,
        build_official_associated_team_filter(filter),
        options || { ...OFFICIAL_ASSOCIATED_TEAM_DEFAULT_QUERY_OPTIONS },
      ),
    list_by_official: (official_id: OfficialAssociatedTeam["official_id"]) =>
      list_by_official(repository, official_id),
    list_by_team: (team_id: OfficialAssociatedTeam["team_id"]) =>
      list_by_team(repository, team_id),
    list_all: () =>
      list_official_associated_teams(
        repository,
        {},
        {
          ...OFFICIAL_ASSOCIATED_TEAM_DEFAULT_QUERY_OPTIONS,
        },
      ),
  };
}
