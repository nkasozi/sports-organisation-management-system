import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
  UpdatePlayerTeamMembershipInput,
} from "../../../../entities/PlayerTeamMembership";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface PlayerTeamMembershipFilter {
  organization_id?: string;
  player_id?: string;
  team_id?: string;
  status?: PlayerTeamMembership["status"];
}

export interface PlayerTeamMembershipRepository extends FilterableRepository<
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
  PlayerTeamMembershipFilter
> {
  find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
  find_by_player(
    player_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
}
