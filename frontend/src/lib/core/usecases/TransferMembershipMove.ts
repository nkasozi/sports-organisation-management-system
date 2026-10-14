import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
} from "../entities/PlayerTeamMembership";
import type { PlayerTeamTransferHistory } from "../entities/PlayerTeamTransferHistory";
import { MEMBERSHIP_STATUS } from "../entities/StatusConstants";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  MEMBERSHIP_ENTITY_TYPE,
  NEW_MEMBERSHIP_DEFAULT_JERSEY_NUMBER,
  PLAYER_TEAM_TRANSFER_LOG_SCOPE,
  PlayerTeamTransferEvent,
} from "./PlayerTeamTransferUseCasesConstants";
import {
  end_from_team_membership,
  reactivate_from_team_membership,
} from "./TransferMembershipEnding";
import {
  fail_from_team_mismatch,
  MembershipMoveKind,
  plan_membership_move,
  report_already_on_destination,
} from "./TransferMembershipMovePlan";
import { forward_dependency_result } from "./UseCaseResultGuards";

function as_record(value: object): Record<string, unknown> {
  return { ...value };
}

function build_destination_membership_input(
  transfer: PlayerTeamTransferHistory,
): CreatePlayerTeamMembershipInput {
  return {
    organization_id: transfer.organization_id,
    player_id: transfer.player_id,
    team_id: transfer.to_team_id,
    start_date: transfer.transfer_date,
    jersey_number: NEW_MEMBERSHIP_DEFAULT_JERSEY_NUMBER,
    status: MEMBERSHIP_STATUS.ACTIVE,
  };
}

async function create_destination_membership(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
): AsyncResult<boolean> {
  const create_result = forward_dependency_result(
    await membership_repository.create(
      build_destination_membership_input(transfer),
    ),
    {
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event: PlayerTeamTransferEvent.MEMBERSHIP_CREATE_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { transfer_id: transfer.id, player_id: transfer.player_id },
    },
  );
  if (!create_result.success) {
    return create_result;
  }
  const created = create_result.data;
  EventBus.emit_entity_created(
    MEMBERSHIP_ENTITY_TYPE,
    created.id,
    created.id,
    as_record(created),
  );
  console.log(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
    event: PlayerTeamTransferEvent.MEMBERSHIP_CREATED,
    transfer_id: transfer.id,
    membership_id: created.id,
  });
  return create_success_result(true);
}

async function end_and_create_membership(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
  from_membership: PlayerTeamMembership,
): AsyncResult<boolean> {
  const ended = await end_from_team_membership(
    membership_repository,
    transfer,
    from_membership,
  );
  if (!ended.success) return ended;
  const created = await create_destination_membership(
    membership_repository,
    transfer,
  );
  if (created.success) return created;
  const reactivated = await reactivate_from_team_membership(
    membership_repository,
    transfer,
    from_membership,
  );
  return reactivated.success ? created : reactivated;
}

async function end_from_membership_only(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
  from_membership: PlayerTeamMembership,
): AsyncResult<boolean> {
  const ended = await end_from_team_membership(
    membership_repository,
    transfer,
    from_membership,
  );
  return ended.success ? create_success_result(true) : ended;
}

function create_unlinked_destination_membership(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
): AsyncResult<boolean> {
  console.warn(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
    event: PlayerTeamTransferEvent.MEMBERSHIP_NOT_FOUND,
    transfer_id: transfer.id,
    player_id: transfer.player_id,
  });
  return create_destination_membership(membership_repository, transfer);
}

export async function move_membership_for_transfer(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
): AsyncResult<boolean> {
  const plan_result = await plan_membership_move(
    membership_repository,
    transfer,
  );
  if (!plan_result.success) {
    return plan_result;
  }
  const plan = plan_result.data;
  switch (plan.kind) {
    case MembershipMoveKind.END_AND_CREATE:
      return end_and_create_membership(
        membership_repository,
        transfer,
        plan.membership,
      );
    case MembershipMoveKind.END_FROM_ONLY:
      return end_from_membership_only(
        membership_repository,
        transfer,
        plan.membership,
      );
    case MembershipMoveKind.CREATE_NEW:
      return create_unlinked_destination_membership(
        membership_repository,
        transfer,
      );
    case MembershipMoveKind.ALREADY_ON_DESTINATION:
      return report_already_on_destination(transfer);
    case MembershipMoveKind.FROM_TEAM_MISMATCH:
      return fail_from_team_mismatch(transfer);
  }
}
