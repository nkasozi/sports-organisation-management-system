import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../../entities/Player";

export interface PlayerFilter {
  name_contains?: string;
  team_id?: string;
  position_id?: string;
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
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player>;
  find_active_players(options?: QueryOptions): PaginatedAsyncResult<Player>;
  find_by_jersey_number(
    team_id: string,
    jersey_number: number,
  ): PaginatedAsyncResult<Player>;
}
