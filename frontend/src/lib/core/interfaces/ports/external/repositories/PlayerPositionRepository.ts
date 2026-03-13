import type { Repository, FilterableRepository, QueryOptions } from "./Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../../../types/Result";
import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../../../../entities/PlayerPosition";

export type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
};

export interface PlayerPositionRepository extends FilterableRepository<
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter
> {
  find_by_code(code: string): AsyncResult<PlayerPosition | null>;
  find_by_sport_type(sport_type: string): AsyncResult<PlayerPosition[]>;
  find_by_category(
    category: PlayerPosition["category"],
  ): AsyncResult<PlayerPosition[]>;
  find_available_positions(): AsyncResult<PlayerPosition[]>;
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition>;
}
