import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../../entities/PlayerPosition";
import type { AsyncResult } from "../../types/Result";
import type { BaseUseCasesPort, EntityListResult } from "./BaseUseCasesPort";

export interface PlayerPositionUseCasesPort extends BaseUseCasesPort<
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter
> {
  list_positions_by_sport(
    sport_type: string,
  ): Promise<EntityListResult<PlayerPosition>>;
  find_by_code(code: string): AsyncResult<PlayerPosition | null>;
  find_by_sport_type(sport_type: string): AsyncResult<PlayerPosition[]>;
  find_by_category(
    category: PlayerPosition["category"],
  ): AsyncResult<PlayerPosition[]>;
  find_available_positions(): AsyncResult<PlayerPosition[]>;
}
