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
import { fail_validation, is_blank_identifier } from "./UseCaseResultGuards";

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
  return forward_transfer_dependency(
    await repository.create(input),
    PlayerTeamTransferEvent.CREATE_FAILED,
    context,
  );
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
