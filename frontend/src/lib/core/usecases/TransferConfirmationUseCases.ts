import type { PlayerTeamTransferHistory } from "../entities/PlayerTeamTransferHistory";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamTransferHistoryRepository,
  PlayerTeamTransferHistoryUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  PLAYER_TEAM_TRANSFER_LOG_SCOPE,
  PlayerTeamTransferEvent,
  PlayerTeamTransferMessage,
} from "./PlayerTeamTransferUseCasesConstants";
import { move_membership_for_transfer } from "./TransferMembershipMove";
import {
  announce_resolution,
  persist_resolution_status,
  restore_original_status,
} from "./TransferResolutionPersistence";
import {
  decide_transfer_resolution,
  TransferResolution,
  TransferResolutionOutcome,
  type TransferResolutionValue,
} from "./TransferResolutionStateMachine";
import {
  fail_missing_identifier,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

type TransferConfirmationMethods = Pick<
  PlayerTeamTransferHistoryUseCasesPort,
  "confirm_transfer" | "reject_transfer"
>;

type TransferId = ScalarValueInput<PlayerTeamTransferHistory["id"]>;

interface TransferResolutionDependencies {
  repository: PlayerTeamTransferHistoryRepository;
  membership_repository: PlayerTeamMembershipRepository;
}

async function load_resolvable_transfer(
  repository: PlayerTeamTransferHistoryRepository,
  transfer_id: TransferId,
  resolution: TransferResolutionValue,
): AsyncResult<PlayerTeamTransferHistory> {
  const context = { transfer_id, resolution };
  if (is_blank_identifier(transfer_id)) {
    return fail_missing_identifier({
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event: PlayerTeamTransferEvent.RESOLUTION_ID_MISSING,
      context: { resolution },
      user_message: PlayerTeamTransferMessage.ID_REQUIRED,
    });
  }
  return forward_dependency_result(await repository.find_by_id(transfer_id), {
    log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
    event: PlayerTeamTransferEvent.RESOLUTION_TARGET_NOT_FOUND,
    code: UseCaseErrorCode.NOT_FOUND,
    context,
    user_message: PlayerTeamTransferMessage.NOT_FOUND,
  });
}

function reject_resolution(
  transfer: PlayerTeamTransferHistory,
  resolution: TransferResolutionValue,
  reason: string,
): Result<never> {
  return fail_with_message(
    {
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event: PlayerTeamTransferEvent.RESOLUTION_REJECTED,
      context: {
        transfer_id: transfer.id,
        resolution,
        status: transfer.status,
      },
      user_message: reason,
    },
    UseCaseErrorCode.INVALID_STATE_TRANSITION,
  );
}

async function apply_membership_side_effects(
  dependencies: TransferResolutionDependencies,
  transfer: PlayerTeamTransferHistory,
  resolution: TransferResolutionValue,
): AsyncResult<boolean> {
  switch (resolution) {
    case TransferResolution.CONFIRM:
      return move_membership_for_transfer(
        dependencies.membership_repository,
        transfer,
      );
    case TransferResolution.REJECT:
      return create_success_result(true);
  }
}

async function apply_resolution(
  dependencies: TransferResolutionDependencies,
  transfer: PlayerTeamTransferHistory,
  next_status: PlayerTeamTransferHistory["status"],
  resolution: TransferResolutionValue,
): AsyncResult<PlayerTeamTransferHistory> {
  const persisted = await persist_resolution_status(
    dependencies.repository,
    transfer,
    next_status,
    resolution,
  );
  if (!persisted.success) return persisted;
  const side_effect_result = await apply_membership_side_effects(
    dependencies,
    transfer,
    resolution,
  );
  if (!side_effect_result.success) {
    const rollback_result = await restore_original_status(
      dependencies.repository,
      transfer,
      resolution,
    );
    return rollback_result.success ? side_effect_result : rollback_result;
  }
  announce_resolution(transfer, persisted.data, resolution);
  return persisted;
}

async function resolve_transfer(
  dependencies: TransferResolutionDependencies,
  transfer_id: TransferId,
  resolution: TransferResolutionValue,
): AsyncResult<PlayerTeamTransferHistory> {
  const transfer_result = await load_resolvable_transfer(
    dependencies.repository,
    transfer_id,
    resolution,
  );
  if (!transfer_result.success) {
    return transfer_result;
  }
  const transfer = transfer_result.data;
  const decision = decide_transfer_resolution(transfer.status, resolution);
  if (decision.outcome === TransferResolutionOutcome.REJECTED) {
    return reject_resolution(transfer, resolution, decision.reason);
  }
  return apply_resolution(
    dependencies,
    transfer,
    decision.next_status,
    resolution,
  );
}

export function create_transfer_confirmation(
  repository: PlayerTeamTransferHistoryRepository,
  membership_repository: PlayerTeamMembershipRepository,
): TransferConfirmationMethods {
  const dependencies = { repository, membership_repository };
  return {
    confirm_transfer: (transfer_id) =>
      resolve_transfer(dependencies, transfer_id, TransferResolution.CONFIRM),
    reject_transfer: (transfer_id) =>
      resolve_transfer(dependencies, transfer_id, TransferResolution.REJECT),
  };
}
