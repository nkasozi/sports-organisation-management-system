import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
  UpdatePlayerTeamMembershipInput,
} from "../../../../entities/PlayerTeamMembership";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface PlayerTeamMembershipFilter {
  organization_id?: ScalarValueInput<PlayerTeamMembership["organization_id"]>;
  player_id?: ScalarValueInput<PlayerTeamMembership["player_id"]>;
  team_id?: ScalarValueInput<PlayerTeamMembership["team_id"]>;
  status?: PlayerTeamMembership["status"];
}

export interface PlayerTeamMembershipRepository extends FilterableRepository<
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
  PlayerTeamMembershipFilter
> {
  find_by_team(
    team_id: ScalarValueInput<PlayerTeamMembership["team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
  find_by_player(
    player_id: ScalarValueInput<PlayerTeamMembership["player_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
}
