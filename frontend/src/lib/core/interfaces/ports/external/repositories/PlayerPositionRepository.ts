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

const PLAYER_POSITION_NOT_FOUND_BY_CODE_ERROR_PREFIX =
  "Player position not found by code";

export function build_player_position_not_found_by_code_error(
  code: string,
): string {
  return `${PLAYER_POSITION_NOT_FOUND_BY_CODE_ERROR_PREFIX}: ${code}`;
}

export function is_player_position_not_found_by_code_error(
  error: string,
  code: string,
): boolean {
  return error === build_player_position_not_found_by_code_error(code);
}

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
  find_by_code(code: string): AsyncResult<PlayerPosition>;
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
