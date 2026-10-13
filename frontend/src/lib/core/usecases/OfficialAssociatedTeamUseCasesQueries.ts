import type { OfficialAssociatedTeam } from "$lib/core/entities/OfficialAssociatedTeam";
import type {
  OfficialAssociatedTeamFilter,
  OfficialAssociatedTeamRepository,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  OFFICIAL_ASSOCIATED_TEAM_DEFAULT_QUERY_OPTIONS,
  OFFICIAL_ASSOCIATED_TEAM_USE_CASES_LOG_SCOPE,
  OfficialAssociatedTeamUseCaseEvent,
} from "./OfficialAssociatedTeamUseCasesConstants";
import type { UseCaseFailureTarget } from "./UseCaseResultGuards";
import { forward_dependency_result } from "./UseCaseResultGuards";

export type OfficialAssociatedTeamId = ScalarValueInput<
  OfficialAssociatedTeam["id"]
>;

export function build_target(
  event: string,
  context: Record<string, unknown>,
): UseCaseFailureTarget {
  return {
    log_scope: OFFICIAL_ASSOCIATED_TEAM_USE_CASES_LOG_SCOPE,
    event,
    context,
  };
}

export async function get_official_associated_team_by_id(
  repository: OfficialAssociatedTeamRepository,
  id: OfficialAssociatedTeamId,
): AsyncResult<OfficialAssociatedTeam> {
  return forward_dependency_result(await repository.find_by_id(id), {
    ...build_target(OfficialAssociatedTeamUseCaseEvent.GET_FAILED, {
      official_associated_team_id: id,
    }),
    code: UseCaseErrorCode.NOT_FOUND,
  });
}

export function build_official_associated_team_filter(
  filter: OfficialAssociatedTeamFilter | Record<string, string> | undefined,
): OfficialAssociatedTeamFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.official_id
      ? {
          official_id:
            filter.official_id as OfficialAssociatedTeam["official_id"],
        }
      : {}),
    ...(filter.team_id
      ? { team_id: filter.team_id as OfficialAssociatedTeam["team_id"] }
      : {}),
    ...(filter.association_type
      ? { association_type: filter.association_type }
      : {}),
    ...(filter.status
      ? { status: filter.status as OfficialAssociatedTeam["status"] }
      : {}),
  };
}

export async function list_official_associated_teams(
  repository: OfficialAssociatedTeamRepository,
  filter: OfficialAssociatedTeamFilter,
  options: QueryOptions,
): PaginatedAsyncResult<OfficialAssociatedTeam> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    ...build_target(OfficialAssociatedTeamUseCaseEvent.LIST_FAILED, {}),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export async function list_by_official(
  repository: OfficialAssociatedTeamRepository,
  official_id: OfficialAssociatedTeam["official_id"],
): PaginatedAsyncResult<OfficialAssociatedTeam> {
  const result = await repository.find_by_official(official_id, {
    ...OFFICIAL_ASSOCIATED_TEAM_DEFAULT_QUERY_OPTIONS,
  });
  return forward_dependency_result(result, {
    ...build_target(
      OfficialAssociatedTeamUseCaseEvent.LIST_BY_OFFICIAL_FAILED,
      { official_id },
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export async function list_by_team(
  repository: OfficialAssociatedTeamRepository,
  team_id: OfficialAssociatedTeam["team_id"],
): PaginatedAsyncResult<OfficialAssociatedTeam> {
  const result = await repository.find_by_team(team_id, {
    ...OFFICIAL_ASSOCIATED_TEAM_DEFAULT_QUERY_OPTIONS,
  });
  return forward_dependency_result(result, {
    ...build_target(OfficialAssociatedTeamUseCaseEvent.LIST_BY_TEAM_FAILED, {
      team_id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}
