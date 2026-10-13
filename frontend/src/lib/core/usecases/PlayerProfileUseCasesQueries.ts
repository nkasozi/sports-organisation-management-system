import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
import type {
  PlayerProfileFilter,
  PlayerProfileRepository,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
  PlayerProfileUseCaseEvent,
  PlayerProfileUseCaseMessage,
} from "./PlayerProfileUseCasesConstants";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type PlayerProfileId = ScalarValueInput<PlayerProfile["id"]>;
type PlayerId = ScalarValueInput<PlayerProfile["player_id"]>;
type PlayerProfileListFilter = PlayerProfileFilter | Record<string, string>;

export function fail_missing_player_profile_identifier(
  event: string,
  user_message: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

function build_player_profile_filter(
  filter: PlayerProfileListFilter | undefined,
): PlayerProfileFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.player_id
      ? { player_id: filter.player_id as PlayerProfile["player_id"] }
      : {}),
    ...(filter.visibility
      ? { visibility: filter.visibility as PlayerProfileFilter["visibility"] }
      : {}),
    ...(filter.status
      ? { status: filter.status as PlayerProfileFilter["status"] }
      : {}),
  };
}

export async function list_player_profiles(
  repository: PlayerProfileRepository,
  filter: PlayerProfileListFilter | undefined,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<PlayerProfile> {
  const result = await repository.find_all(
    build_player_profile_filter(filter),
    options ?? {},
  );
  return forward_dependency_result(result, {
    log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
    event: PlayerProfileUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

export async function get_player_profile_by_id(
  repository: PlayerProfileRepository,
  id: PlayerProfileId,
): AsyncResult<PlayerProfile> {
  if (is_blank_identifier(id)) {
    return fail_missing_player_profile_identifier(
      PlayerProfileUseCaseEvent.GET_ID_MISSING,
      PlayerProfileUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
    event: PlayerProfileUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { player_profile_id: id },
  });
}

export async function get_player_profile_by_player_id(
  repository: PlayerProfileRepository,
  player_id: PlayerId,
): AsyncResult<PlayerProfile> {
  if (is_blank_identifier(player_id)) {
    return fail_missing_player_profile_identifier(
      PlayerProfileUseCaseEvent.GET_BY_PLAYER_ID_MISSING,
      PlayerProfileUseCaseMessage.PLAYER_ID_REQUIRED,
    );
  }
  return forward_dependency_result(
    await repository.find_by_player_id(player_id),
    {
      log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
      event: PlayerProfileUseCaseEvent.GET_BY_PLAYER_FAILED,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { player_id },
    },
  );
}

export async function get_player_profile_by_slug(
  repository: PlayerProfileRepository,
  slug: string,
): AsyncResult<PlayerProfile> {
  if (is_blank_identifier(slug)) {
    return fail_missing_player_profile_identifier(
      PlayerProfileUseCaseEvent.GET_BY_SLUG_MISSING,
      PlayerProfileUseCaseMessage.SLUG_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_slug(slug), {
    log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
    event: PlayerProfileUseCaseEvent.GET_BY_SLUG_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: {},
  });
}

export async function list_public_player_profiles(
  repository: PlayerProfileRepository,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<PlayerProfile> {
  return forward_dependency_result(
    await repository.find_public_profiles(options),
    {
      log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
      event: PlayerProfileUseCaseEvent.LIST_PUBLIC_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: {},
    },
  );
}
