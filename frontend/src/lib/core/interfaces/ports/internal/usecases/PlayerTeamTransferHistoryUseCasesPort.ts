import type {
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
  UpdatePlayerTeamTransferHistoryInput,
} from "../../../../entities/PlayerTeamTransferHistory";
import type { PlayerTeamTransferHistoryFilter } from "../../external/repositories/PlayerTeamTransferHistoryRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface PlayerTeamTransferHistoryUseCasesPort extends BaseUseCasesPort<
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
  UpdatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistoryFilter
> {
  list_transfers_by_player(
    player_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  list_transfers_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  list_pending_transfers(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  confirm_transfer(
    transfer_id: string,
  ): AsyncResult<PlayerTeamTransferHistory>;

  reject_transfer(
    transfer_id: string,
  ): AsyncResult<PlayerTeamTransferHistory>;

  delete_transfers(ids: string[]): AsyncResult<number>;
}
