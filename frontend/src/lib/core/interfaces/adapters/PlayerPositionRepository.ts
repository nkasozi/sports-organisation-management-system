import type { Repository, FilterableRepository } from "./Repository";
import type {
  PlayerPosition,
  CreatePlayerPositionInput,
  UpdatePlayerPositionInput,
  PlayerPositionFilter,
} from "../../entities/PlayerPosition";

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
  find_by_code(code: string): Promise<PlayerPosition | null>;
  find_by_sport_type(sport_type: string): Promise<PlayerPosition[]>;
  find_by_category(
    category: PlayerPosition["category"],
  ): Promise<PlayerPosition[]>;
  find_available_positions(): Promise<PlayerPosition[]>;
}
