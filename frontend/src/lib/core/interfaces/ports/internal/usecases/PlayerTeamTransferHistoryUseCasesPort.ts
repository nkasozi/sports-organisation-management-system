import type {
  CreatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistory,
  UpdatePlayerTeamTransferHistoryInput,
} from "../../../../entities/PlayerTeamTransferHistory";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { PlayerTeamTransferHistoryFilter } from "../../external/repositories/PlayerTeamTransferHistoryRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface PlayerTeamTransferHistoryUseCasesPort extends BaseUseCasesPort<
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
  UpdatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistoryFilter
> {
  list_transfers_by_player(
    player_id: ScalarValueInput<PlayerTeamTransferHistory["player_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  list_transfers_by_team(
    team_id: ScalarValueInput<PlayerTeamTransferHistory["from_team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  list_pending_transfers(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  confirm_transfer(
    transfer_id: ScalarValueInput<PlayerTeamTransferHistory["id"]>,
  ): AsyncResult<PlayerTeamTransferHistory>;

  reject_transfer(
    transfer_id: ScalarValueInput<PlayerTeamTransferHistory["id"]>,
  ): AsyncResult<PlayerTeamTransferHistory>;

  delete_transfers(
    ids: Array<ScalarValueInput<PlayerTeamTransferHistory["id"]>>,
  ): AsyncResult<number>;
}
