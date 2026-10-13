import type { PlayerTeamTransferHistory } from "../entities/PlayerTeamTransferHistory";
import type {
  PlayerTeamTransferHistoryRepository,
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
  PLAYER_TEAM_TRANSFER_LOG_SCOPE,
  PlayerTeamTransferEvent,
  PlayerTeamTransferMessage,
} from "./PlayerTeamTransferUseCasesConstants";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export function fail_missing_transfer_identifier(
  event: string,
  user_message: string,
): Result<never> {
  return fail_missing_identifier({
    log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
    event,
    context: {},
    user_message,
  });
}

export function forward_transfer_dependency<TData>(
  result: Result<TData>,
  event: string,
  context: Record<string, unknown>,
): Result<TData> {
  return forward_dependency_result(result, {
    log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
    event,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

export async function get_transfer_by_id(
  repository: PlayerTeamTransferHistoryRepository,
  id: ScalarValueInput<PlayerTeamTransferHistory["id"]>,
): AsyncResult<PlayerTeamTransferHistory> {
  if (is_blank_identifier(id)) {
    return fail_missing_transfer_identifier(
      PlayerTeamTransferEvent.GET_ID_MISSING,
      PlayerTeamTransferMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: PLAYER_TEAM_TRANSFER_LOG_SCOPE,
    event: PlayerTeamTransferEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { transfer_id: id },
  });
}

export async function list_transfers_by_player(
  repository: PlayerTeamTransferHistoryRepository,
  player_id: ScalarValueInput<PlayerTeamTransferHistory["player_id"]>,
  options?: QueryOptions,
): PaginatedAsyncResult<PlayerTeamTransferHistory> {
  if (is_blank_identifier(player_id)) {
    return fail_missing_transfer_identifier(
      PlayerTeamTransferEvent.LIST_BY_PLAYER_ID_MISSING,
      PlayerTeamTransferMessage.PLAYER_ID_REQUIRED,
    );
  }
  return forward_transfer_dependency(
    await repository.find_by_player(player_id, options),
    PlayerTeamTransferEvent.LIST_FAILED,
    { player_id },
  );
}

export async function list_transfers_by_team(
  repository: PlayerTeamTransferHistoryRepository,
  team_id: ScalarValueInput<PlayerTeamTransferHistory["from_team_id"]>,
  options?: QueryOptions,
): PaginatedAsyncResult<PlayerTeamTransferHistory> {
  if (is_blank_identifier(team_id)) {
    return fail_missing_transfer_identifier(
      PlayerTeamTransferEvent.LIST_BY_TEAM_ID_MISSING,
      PlayerTeamTransferMessage.TEAM_ID_REQUIRED,
    );
  }
  return forward_transfer_dependency(
    await repository.find_by_team(team_id, options),
    PlayerTeamTransferEvent.LIST_FAILED,
    { team_id },
  );
}
