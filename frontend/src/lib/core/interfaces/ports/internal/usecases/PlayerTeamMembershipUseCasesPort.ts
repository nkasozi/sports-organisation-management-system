import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
  UpdatePlayerTeamMembershipInput,
} from "../../../../entities/PlayerTeamMembership";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { PlayerTeamMembershipFilter } from "../../external/repositories/PlayerTeamMembershipRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface PlayerTeamMembershipUseCasesPort extends BaseUseCasesPort<
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
  PlayerTeamMembershipFilter
> {
  list_memberships_by_team(
    team_id: ScalarValueInput<PlayerTeamMembership["team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
  list_memberships_by_player(
    player_id: ScalarValueInput<PlayerTeamMembership["player_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership>;
  delete_memberships(
    ids: ScalarValueInput<PlayerTeamMembership["id"]>[],
  ): AsyncResult<number>;
}
