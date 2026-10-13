import { EventBus } from "$lib/infrastructure/events/EventBus";

import type { PlayerTeamTransferHistory } from "../entities/PlayerTeamTransferHistory";
import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  PLAYER_TEAM_TRANSFER_LOG_SCOPE,
  PlayerTeamTransferEvent,
  PlayerTeamTransferMessage,
  TRANSFER_ENTITY_TYPE,
} from "./PlayerTeamTransferUseCasesConstants";
import type { TransferResolutionValue } from "./TransferResolutionStateMachine";
import {
  fail_with_message,
  forward_dependency_result,
} from "./UseCaseResultGuards";

export async function persist_resolution_status(
  repository: PlayerTeamTransferHistoryRepository,
  transfer: PlayerTeamTransferHistory,
  next_status: PlayerTeamTransferHistory["status"],
  resolution: TransferResolutionValue,
): AsyncResult<PlayerTeamTransferHistory> {
  return forward_dependency_result(
    await repository.update(transfer.id, { status: next_status }),
    {
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event: PlayerTeamTransferEvent.RESOLUTION_SAVE_FAILED,
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      context: { transfer_id: transfer.id, resolution },
    },
  );
}

export async function restore_original_status(
  repository: PlayerTeamTransferHistoryRepository,
  transfer: PlayerTeamTransferHistory,
  resolution: TransferResolutionValue,
): AsyncResult<boolean> {
  const restore_result = await repository.update(transfer.id, {
    status: transfer.status,
  });
  const event = restore_result.success
    ? PlayerTeamTransferEvent.RESOLUTION_ROLLED_BACK
    : PlayerTeamTransferEvent.RESOLUTION_ROLLBACK_FAILED;
  console.error(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
    event,
    transfer_id: transfer.id,
    resolution,
    restored_status: transfer.status,
  });
  return restore_result.success
    ? create_success_result(true)
    : fail_with_message(
        {
          log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
          event: PlayerTeamTransferEvent.RESOLUTION_ROLLBACK_FAILED,
          context: { transfer_id: transfer.id, resolution },
          user_message: PlayerTeamTransferMessage.NEEDS_ATTENTION,
        },
        UseCaseErrorCode.DEPENDENCY_FAILED,
      );
}

export function announce_resolution(
  transfer: PlayerTeamTransferHistory,
  resolved_transfer: PlayerTeamTransferHistory,
  resolution: TransferResolutionValue,
): boolean {
  EventBus.emit_entity_updated(
    TRANSFER_ENTITY_TYPE,
    transfer.id,
    transfer.id,
    { ...transfer },
    { ...resolved_transfer },
    ["status"],
  );
  console.log(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
    event: PlayerTeamTransferEvent.RESOLVED,
    transfer_id: transfer.id,
    resolution,
    status: resolved_transfer.status,
  });
  return true;
}
