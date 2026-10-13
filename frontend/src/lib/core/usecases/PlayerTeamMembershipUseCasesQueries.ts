import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type {
  PlayerTeamMembershipFilter,
  PlayerTeamMembershipRepository,
  QueryOptions,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
  PlayerTeamMembershipUseCaseEvent,
  PlayerTeamMembershipUseCaseMessage,
} from "./PlayerTeamMembershipUseCasesConstants";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type MembershipId = ScalarValueInput<PlayerTeamMembership["id"]>;

export function fail_missing_membership_identifier(
  event: string,
  user_message: string,
): Result<never, string> {
  return fail_missing_identifier({
    log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

export async function list_memberships(
  repository: PlayerTeamMembershipRepository,
  filter: PlayerTeamMembershipFilter,
  options: QueryOptions,
): PaginatedAsyncResult<PlayerTeamMembership> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
    event: PlayerTeamMembershipUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

export async function get_membership_by_id(
  repository: PlayerTeamMembershipRepository,
  id: MembershipId,
): AsyncResult<PlayerTeamMembership> {
  if (is_blank_identifier(id)) {
    return fail_missing_membership_identifier(
      PlayerTeamMembershipUseCaseEvent.GET_ID_MISSING,
      PlayerTeamMembershipUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
    event: PlayerTeamMembershipUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { membership_id: id },
  });
}

export async function list_memberships_by_team(
  repository: PlayerTeamMembershipRepository,
  team_id: ScalarValueInput<PlayerTeamMembership["team_id"]>,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<PlayerTeamMembership> {
  if (is_blank_identifier(team_id)) {
    return fail_missing_membership_identifier(
      PlayerTeamMembershipUseCaseEvent.LIST_BY_TEAM_ID_MISSING,
      PlayerTeamMembershipUseCaseMessage.TEAM_ID_REQUIRED,
    );
  }
  return forward_dependency_result(
    await repository.find_by_team(team_id, options),
    {
      log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
      event: PlayerTeamMembershipUseCaseEvent.LIST_BY_TEAM_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { team_id },
    },
  );
}

export async function list_memberships_by_player(
  repository: PlayerTeamMembershipRepository,
  player_id: ScalarValueInput<PlayerTeamMembership["player_id"]>,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<PlayerTeamMembership> {
  if (is_blank_identifier(player_id)) {
    return fail_missing_membership_identifier(
      PlayerTeamMembershipUseCaseEvent.LIST_BY_PLAYER_ID_MISSING,
      PlayerTeamMembershipUseCaseMessage.PLAYER_ID_REQUIRED,
    );
  }
  return forward_dependency_result(
    await repository.find_by_player(player_id, options),
    {
      log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
      event: PlayerTeamMembershipUseCaseEvent.LIST_BY_PLAYER_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { player_id },
    },
  );
}
