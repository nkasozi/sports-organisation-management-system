import type {
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
} from "../../entities/PlayerTeamMembership";
import type { PlayerTeamMembershipFilter } from "../adapters/PlayerTeamMembershipRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
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
  ): Promise<PaginatedAsyncResult<PlayerTeamMembership>>;
  list_memberships_by_player(
    player_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<PlayerTeamMembership>>;
  delete_memberships(ids: string[]): Promise<AsyncResult<number>>;
}
