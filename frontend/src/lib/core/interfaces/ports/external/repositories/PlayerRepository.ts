import type {
  CreatePlayerInput,
  Player,
  UpdatePlayerInput,
} from "../../../../entities/Player";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface PlayerFilter {
  organization_id?: ScalarValueInput<Player["organization_id"]>;
  id?: ScalarValueInput<Player["id"]>;
  name_contains?: string;
  team_id?: ScalarValueInput<Player["id"]>;
  position_id?: ScalarValueInput<Player["position_id"]>;
  status?: Player["status"];
  nationality?: string;
}

export interface PlayerRepository extends FilterableRepository<
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  PlayerFilter
> {
  find_by_team(
    team_id: ScalarValueInput<Player["id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player>;
  find_active_players(options?: QueryOptions): PaginatedAsyncResult<Player>;
  find_by_jersey_number(
    team_id: ScalarValueInput<Player["id"]>,
    jersey_number: number,
  ): PaginatedAsyncResult<Player>;
}
