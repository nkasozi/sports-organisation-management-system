import type {
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
} from "../../../../entities/PlayerTeamMembership";
import type { PlayerTeamMembershipFilter } from "../../external/repositories/PlayerTeamMembershipRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface PlayerTeamMembershipUseCasesPort extends BaseUseCasesPort<
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
  PlayerTeamMembershipFilter
> {
  list_memberships_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
  list_memberships_by_player(
    player_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
  delete_memberships(ids: string[]): AsyncResult<number>;
}
