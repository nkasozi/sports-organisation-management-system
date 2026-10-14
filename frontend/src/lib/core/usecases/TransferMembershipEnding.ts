import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  PlayerTeamMembership,
  PlayerTeamMembershipStatus,
} from "../entities/PlayerTeamMembership";
import type { PlayerTeamTransferHistory } from "../entities/PlayerTeamTransferHistory";
import { MEMBERSHIP_STATUS } from "../entities/StatusConstants";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  MEMBERSHIP_ENTITY_TYPE,
  PLAYER_TEAM_TRANSFER_LOG_SCOPE,
  PlayerTeamTransferEvent,
} from "./PlayerTeamTransferUseCasesConstants";
import { forward_dependency_result } from "./UseCaseResultGuards";

const MEMBERSHIP_STATUS_FIELD = "status";

async function set_membership_status(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
  membership: PlayerTeamMembership,
  status: PlayerTeamMembershipStatus,
): AsyncResult<PlayerTeamMembership> {
  const update_result = forward_dependency_result(
    await membership_repository.update(membership.id, { status }),
    {
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event: PlayerTeamTransferEvent.MEMBERSHIP_UPDATE_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { transfer_id: transfer.id, membership_id: membership.id },
    },
  );
  if (!update_result.success) return update_result;
  EventBus.emit_entity_updated(
    MEMBERSHIP_ENTITY_TYPE,
    membership.id,
    membership.id,
    { ...membership },
    { ...update_result.data },
    [MEMBERSHIP_STATUS_FIELD],
  );
  return update_result;
}

export async function end_from_team_membership(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
  membership: PlayerTeamMembership,
): AsyncResult<PlayerTeamMembership> {
  const result = await set_membership_status(
    membership_repository,
    transfer,
    membership,
    MEMBERSHIP_STATUS.ENDED,
  );
  if (result.success)
    console.log(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
      event: PlayerTeamTransferEvent.MEMBERSHIP_ENDED,
      transfer_id: transfer.id,
      membership_id: membership.id,
    });
  return result;
}

export async function reactivate_from_team_membership(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
  membership: PlayerTeamMembership,
): AsyncResult<boolean> {
  const result = await set_membership_status(
    membership_repository,
    transfer,
    membership,
    MEMBERSHIP_STATUS.ACTIVE,
  );
  if (result.success) return create_success_result(true);
  console.error(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
    event: PlayerTeamTransferEvent.MEMBERSHIP_REACTIVATION_FAILED,
    transfer_id: transfer.id,
    membership_id: membership.id,
  });
  return result;
}
