import type { TeamProfile } from "$lib/core/entities/TeamProfile";
import type {
  QueryOptions,
  TeamProfileFilter,
  TeamProfileRepository,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  TEAM_PROFILE_USE_CASES_LOG_SCOPE,
  TeamProfileUseCaseEvent,
  TeamProfileUseCaseMessage,
} from "./TeamProfileUseCasesConstants";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type TeamProfileId = ScalarValueInput<TeamProfile["id"]>;
type TeamId = ScalarValueInput<TeamProfile["team_id"]>;
type TeamProfileListFilter = TeamProfileFilter | Record<string, string>;

export function fail_missing_team_profile_identifier(
  event: string,
  user_message: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

function build_team_profile_filter(
  filter: TeamProfileListFilter | undefined,
): TeamProfileFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.team_id
      ? { team_id: filter.team_id as TeamProfile["team_id"] }
      : {}),
    ...(filter.visibility
      ? { visibility: filter.visibility as TeamProfileFilter["visibility"] }
      : {}),
    ...(filter.status
      ? { status: filter.status as TeamProfileFilter["status"] }
      : {}),
  };
}

export async function list_team_profiles(
  repository: TeamProfileRepository,
  filter: TeamProfileListFilter | undefined,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<TeamProfile> {
  const result = await repository.find_all(
    build_team_profile_filter(filter),
    options ?? {},
  );
  return forward_dependency_result(result, {
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event: TeamProfileUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

export async function get_team_profile_by_id(
  repository: TeamProfileRepository,
  id: TeamProfileId,
): AsyncResult<TeamProfile> {
  if (is_blank_identifier(id)) {
    return fail_missing_team_profile_identifier(
      TeamProfileUseCaseEvent.GET_ID_MISSING,
      TeamProfileUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event: TeamProfileUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { team_profile_id: id },
  });
}

export async function get_team_profile_by_team_id(
  repository: TeamProfileRepository,
  team_id: TeamId,
): AsyncResult<TeamProfile> {
  if (is_blank_identifier(team_id)) {
    return fail_missing_team_profile_identifier(
      TeamProfileUseCaseEvent.GET_BY_TEAM_ID_MISSING,
      TeamProfileUseCaseMessage.TEAM_ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_team_id(team_id), {
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event: TeamProfileUseCaseEvent.GET_BY_TEAM_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { team_id },
  });
}

export async function get_team_profile_by_slug(
  repository: TeamProfileRepository,
  slug: string,
): AsyncResult<TeamProfile> {
  if (is_blank_identifier(slug)) {
    return fail_missing_team_profile_identifier(
      TeamProfileUseCaseEvent.GET_BY_SLUG_MISSING,
      TeamProfileUseCaseMessage.SLUG_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_slug(slug), {
    log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
    event: TeamProfileUseCaseEvent.GET_BY_SLUG_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: {},
  });
}

export async function list_public_team_profiles(
  repository: TeamProfileRepository,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<TeamProfile> {
  return forward_dependency_result(
    await repository.find_public_profiles(options),
    {
      log_scope: TEAM_PROFILE_USE_CASES_LOG_SCOPE,
      event: TeamProfileUseCaseEvent.LIST_PUBLIC_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: {},
    },
  );
}
