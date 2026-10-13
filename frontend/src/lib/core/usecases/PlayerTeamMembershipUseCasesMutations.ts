import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
  UpdatePlayerTeamMembershipInput,
} from "../entities/PlayerTeamMembership";
import { validate_player_team_membership_input } from "../entities/PlayerTeamMembership";
import { MEMBERSHIP_STATUS } from "../entities/StatusConstants";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import { type AsyncResult, create_success_result } from "../types/Result";
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
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

async function ensure_no_other_active_membership(
  repository: PlayerTeamMembershipRepository,
  input: CreatePlayerTeamMembershipInput,
  context: Record<string, unknown>,
): AsyncResult<boolean> {
  if (input.status !== MEMBERSHIP_STATUS.ACTIVE)
    return create_success_result(true);
  const active_result = forward_dependency_result(
    await repository.find_all({
      player_id: input.player_id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }),
    {
      log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
      event: PlayerTeamMembershipUseCaseEvent.ACTIVE_LOOKUP_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context,
    },
  );
  if (!active_result.success) return active_result;
  if (active_result.data.items.length === 0) return create_success_result(true);
  return fail_with_message(
    {
      log_scope: PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE,
      event: PlayerTeamMembershipUseCaseEvent.ALREADY_ACTIVE_ELSEWHERE,
      context,
      user_message: PlayerTeamMembershipUseCaseMessage.ALREADY_ACTIVE_ELSEWHERE,
    },
    UseCaseErrorCode.CONFLICT,
  );
}

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
  const uniqueness_result = await ensure_no_other_active_membership(
    repository,
    input,
    context,
  );
  if (!uniqueness_result.success) return uniqueness_result;
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
