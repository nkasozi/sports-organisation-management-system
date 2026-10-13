import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type { PlayerTeamTransferHistory } from "../entities/PlayerTeamTransferHistory";
import { MEMBERSHIP_STATUS } from "../entities/StatusConstants";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  PLAYER_TEAM_TRANSFER_LOG_SCOPE,
  PlayerTeamTransferEvent,
  PlayerTeamTransferMessage,
} from "./PlayerTeamTransferUseCasesConstants";
import {
  fail_with_message,
  forward_dependency_result,
} from "./UseCaseResultGuards";

export const MembershipMoveKind = {
  MOVE_EXISTING: "move_existing",
  CREATE_NEW: "create_new",
  ALREADY_ON_DESTINATION: "already_on_destination",
  FROM_TEAM_MISMATCH: "from_team_mismatch",
} as const;

type MembershipMovePlan =
  | {
      kind: typeof MembershipMoveKind.MOVE_EXISTING;
      membership: PlayerTeamMembership;
    }
  | { kind: typeof MembershipMoveKind.CREATE_NEW }
  | { kind: typeof MembershipMoveKind.ALREADY_ON_DESTINATION }
  | { kind: typeof MembershipMoveKind.FROM_TEAM_MISMATCH };

export async function plan_membership_move(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
): AsyncResult<MembershipMovePlan> {
  const memberships_result = forward_dependency_result(
    await membership_repository.find_all({
      player_id: transfer.player_id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }),
    {
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event: PlayerTeamTransferEvent.MEMBERSHIP_LOOKUP_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { transfer_id: transfer.id, player_id: transfer.player_id },
    },
  );
  if (!memberships_result.success) {
    return memberships_result;
  }
  return create_success_result(
    classify_active_memberships(transfer, memberships_result.data.items),
  );
}

function classify_active_memberships(
  transfer: PlayerTeamTransferHistory,
  active_memberships: PlayerTeamMembership[],
): MembershipMovePlan {
  const from_team_membership = active_memberships.find(
    (membership) => membership.team_id === transfer.from_team_id,
  );
  if (from_team_membership)
    return {
      kind: MembershipMoveKind.MOVE_EXISTING,
      membership: from_team_membership,
    };
  if (active_memberships.length === 0)
    return { kind: MembershipMoveKind.CREATE_NEW };
  return active_memberships.some(
    (membership) => membership.team_id === transfer.to_team_id,
  )
    ? { kind: MembershipMoveKind.ALREADY_ON_DESTINATION }
    : { kind: MembershipMoveKind.FROM_TEAM_MISMATCH };
}

export function report_already_on_destination(
  transfer: PlayerTeamTransferHistory,
): Result<boolean> {
  console.info(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
    event: PlayerTeamTransferEvent.MEMBERSHIP_ALREADY_ON_DESTINATION,
    transfer_id: transfer.id,
  });
  return create_success_result(true);
}

export function fail_from_team_mismatch(
  transfer: PlayerTeamTransferHistory,
): Result<never> {
  return fail_with_message(
    {
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event: PlayerTeamTransferEvent.MEMBERSHIP_FROM_TEAM_MISMATCH,
      context: { transfer_id: transfer.id },
      user_message: PlayerTeamTransferMessage.FROM_TEAM_MISMATCH,
    },
    UseCaseErrorCode.CONFLICT,
  );
}
