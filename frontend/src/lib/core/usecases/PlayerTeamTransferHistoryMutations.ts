import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  CreatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistory,
  UpdatePlayerTeamTransferHistoryInput,
} from "../entities/PlayerTeamTransferHistory";
import { validate_player_team_transfer_history_input } from "../entities/PlayerTeamTransferHistory";
import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  fail_missing_transfer_identifier,
  forward_transfer_dependency,
} from "./PlayerTeamTransferHistoryQueries";
import {
  PLAYER_TEAM_TRANSFER_LOG_SCOPE,
  PlayerTeamTransferEvent,
  PlayerTeamTransferMessage,
  TRANSFER_ENTITY_TYPE,
} from "./PlayerTeamTransferUseCasesConstants";
import {
  decide_transfer_creation,
  decide_transfer_edit,
  TRANSFER_EDIT_DECISION,
} from "./TransferEditGuard";
import {
  fail_validation,
  fail_with_message,
  is_blank_identifier,
} from "./UseCaseResultGuards";

type TransferId = ScalarValueInput<PlayerTeamTransferHistory["id"]>;

export async function create_transfer(
  repository: PlayerTeamTransferHistoryRepository,
  input: CreatePlayerTeamTransferHistoryInput,
): AsyncResult<PlayerTeamTransferHistory> {
  const context = { player_id: input.player_id };
  const validation_errors = validate_player_team_transfer_history_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
        event: PlayerTeamTransferEvent.CREATE_VALIDATION_FAILED,
        context,
      },
      validation_errors,
    );
  }
  const creation_decision = decide_transfer_creation(input);
  if (creation_decision.kind === TRANSFER_EDIT_DECISION.REJECTED)
    return reject_transfer_edit(
      PlayerTeamTransferEvent.CREATE_STATUS_REJECTED,
      context,
      creation_decision.reason,
    );
  return forward_transfer_dependency(
    await repository.create(input),
    PlayerTeamTransferEvent.CREATE_FAILED,
    context,
  );
}

function reject_transfer_edit(
  event: string,
  context: Record<string, unknown>,
  reason: string,
): Result<never> {
  return fail_with_message(
    {
      log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
      event,
      context,
      user_message: reason,
    },
    UseCaseErrorCode.INVALID_STATE_TRANSITION,
  );
}

async function check_transfer_edit_allowed(
  repository: PlayerTeamTransferHistoryRepository,
  id: TransferId,
  input: UpdatePlayerTeamTransferHistoryInput,
): AsyncResult<boolean> {
  const context = { transfer_id: id };
  const existing_result = forward_transfer_dependency(
    await repository.find_by_id(id),
    PlayerTeamTransferEvent.UPDATE_TARGET_LOOKUP_FAILED,
    context,
  );
  if (!existing_result.success) return existing_result;
  const decision = decide_transfer_edit(existing_result.data, input);
  return decision.kind === TRANSFER_EDIT_DECISION.REJECTED
    ? reject_transfer_edit(
        PlayerTeamTransferEvent.UPDATE_REJECTED,
        { ...context, status: existing_result.data.status },
        decision.reason,
      )
    : create_success_result(true);
}

export async function update_transfer(
  repository: PlayerTeamTransferHistoryRepository,
  id: TransferId,
  input: UpdatePlayerTeamTransferHistoryInput,
): AsyncResult<PlayerTeamTransferHistory> {
  if (is_blank_identifier(id)) {
    return fail_missing_transfer_identifier(
      PlayerTeamTransferEvent.UPDATE_ID_MISSING,
      PlayerTeamTransferMessage.ID_REQUIRED,
    );
  }
  const edit_check = await check_transfer_edit_allowed(repository, id, input);
  if (!edit_check.success) return edit_check;
  return forward_transfer_dependency(
    await repository.update(id, input),
    PlayerTeamTransferEvent.UPDATE_FAILED,
    { transfer_id: id },
  );
}

export async function delete_transfer(
  repository: PlayerTeamTransferHistoryRepository,
  id: TransferId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_transfer_identifier(
      PlayerTeamTransferEvent.DELETE_ID_MISSING,
      PlayerTeamTransferMessage.ID_REQUIRED,
    );
  }
  return forward_transfer_dependency(
    await repository.delete_by_id(id),
    PlayerTeamTransferEvent.DELETE_FAILED,
    { transfer_id: id },
  );
}

function emit_deleted_transfer(
  id: TransferId,
  snapshot: Result<PlayerTeamTransferHistory>,
): boolean {
  if (!snapshot.success) {
    console.warn(PLAYER_TEAM_TRANSFER_LOG_SCOPE, {
      event: PlayerTeamTransferEvent.BULK_DELETE_SNAPSHOT_UNAVAILABLE,
      transfer_id: id,
      technical_detail: snapshot.error,
    });
    return false;
  }
  EventBus.emit_entity_deleted(
    TRANSFER_ENTITY_TYPE,
    snapshot.data.id,
    snapshot.data.id,
    { ...snapshot.data },
  );
  return true;
}

export async function delete_transfers(
  repository: PlayerTeamTransferHistoryRepository,
  ids: TransferId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_transfer_identifier(
      PlayerTeamTransferEvent.BULK_DELETE_IDS_MISSING,
      PlayerTeamTransferMessage.BULK_IDS_REQUIRED,
    );
  }
  const snapshots = await Promise.all(
    ids.map((id) => repository.find_by_id(id)),
  );
  const result = forward_transfer_dependency(
    await repository.delete_by_ids(ids),
    PlayerTeamTransferEvent.BULK_DELETE_FAILED,
    { transfer_count: ids.length },
  );
  if (!result.success) {
    return result;
  }
  snapshots.forEach((snapshot, index) =>
    emit_deleted_transfer(ids[index], snapshot),
  );
  return result;
}
