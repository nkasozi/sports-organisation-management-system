import type {
  CreatePlayerPositionInput,
  PlayerPosition,
  PlayerPositionFilter,
  UpdatePlayerPositionInput,
} from "../../../../entities/PlayerPosition";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export type {
  CreatePlayerPositionInput,
  PlayerPosition,
  PlayerPositionFilter,
  UpdatePlayerPositionInput,
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
    organization_id: PlayerPosition["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition>;
}
