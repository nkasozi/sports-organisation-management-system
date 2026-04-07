import type {
  CreatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistory,
  PlayerTeamTransferStatus,
  UpdatePlayerTeamTransferHistoryInput,
} from "../../../../entities/PlayerTeamTransferHistory";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface PlayerTeamTransferHistoryFilter {
  organization_id?: string;
  player_id?: string;
  from_team_id?: string;
  to_team_id?: string;
  status?: PlayerTeamTransferStatus;
}

export interface PlayerTeamTransferHistoryRepository extends FilterableRepository<
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
  UpdatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistoryFilter
> {
  find_by_player(
    player_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;

  find_pending_transfers(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory>;
}
