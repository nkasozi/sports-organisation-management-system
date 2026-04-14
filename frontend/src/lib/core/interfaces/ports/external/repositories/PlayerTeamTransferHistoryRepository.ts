import type {
  CreatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistory,
  PlayerTeamTransferStatus,
  UpdatePlayerTeamTransferHistoryInput,
} from "../../../../entities/PlayerTeamTransferHistory";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface PlayerTeamTransferHistoryFilter {
  organization_id?: ScalarValueInput<PlayerTeamTransferHistory["organization_id"]>;
  player_id?: ScalarValueInput<PlayerTeamTransferHistory["player_id"]>;
  from_team_id?: ScalarValueInput<PlayerTeamTransferHistory["from_team_id"]>;
  to_team_id?: ScalarValueInput<PlayerTeamTransferHistory["to_team_id"]>;
  status?: PlayerTeamTransferStatus;
}

export interface PlayerTeamTransferHistoryRepository extends FilterableRepository<
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
  UpdatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistoryFilter
> {
  find_by_player(
    player_id: ScalarValueInput<PlayerTeamTransferHistory["player_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  find_by_team(
    team_id: ScalarValueInput<PlayerTeamTransferHistory["from_team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  find_pending_transfers(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;
}
