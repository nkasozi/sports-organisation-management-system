import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
  UpdatePlayerTeamMembershipInput,
} from "../entities/PlayerTeamMembership";
import { validate_player_team_membership_input } from "../entities/PlayerTeamMembership";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
  PlayerTeamMembershipUseCaseEvent,
  PlayerTeamMembershipUseCaseMessage,
} from "./PlayerTeamMembershipUseCasesConstants";
import type { MembershipId } from "./PlayerTeamMembershipUseCasesQueries";
import { fail_missing_membership_identifier } from "./PlayerTeamMembershipUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export async function create_membership(
  repository: PlayerTeamMembershipRepository,
  input: CreatePlayerTeamMembershipInput,
): AsyncResult<PlayerTeamMembership> {
  const context = {
    organization_id: input.organization_id,
    player_id: input.player_id,
    team_id: input.team_id,
  };
  const validation_errors = validate_player_team_membership_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
        event: PlayerTeamMembershipUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
    event: PlayerTeamMembershipUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

export async function update_membership(
  repository: PlayerTeamMembershipRepository,
  id: MembershipId,
  input: UpdatePlayerTeamMembershipInput,
): AsyncResult<PlayerTeamMembership> {
  if (is_blank_identifier(id)) {
    return fail_missing_membership_identifier(
      PlayerTeamMembershipUseCaseEvent.UPDATE_ID_MISSING,
      PlayerTeamMembershipUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
    event: PlayerTeamMembershipUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { membership_id: id },
  });
}

export async function delete_membership(
  repository: PlayerTeamMembershipRepository,
  id: MembershipId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_membership_identifier(
      PlayerTeamMembershipUseCaseEvent.DELETE_ID_MISSING,
      PlayerTeamMembershipUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
    event: PlayerTeamMembershipUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { membership_id: id },
  });
}

export async function delete_memberships(
  repository: PlayerTeamMembershipRepository,
  ids: MembershipId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_membership_identifier(
      PlayerTeamMembershipUseCaseEvent.BULK_DELETE_IDS_MISSING,
      PlayerTeamMembershipUseCaseMessage.IDS_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_ids(ids), {
    log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
    event: PlayerTeamMembershipUseCaseEvent.BULK_DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { membership_ids: ids },
  });
}
