import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../../../../entities/Player";
import type { PlayerFilter } from "../../external/repositories/PlayerRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { EntityListResult } from "../../../../entities/BaseEntity";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface PlayerUseCasesPort extends BaseUseCasesPort<
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  PlayerFilter
> {
  delete_players(ids: string[]): AsyncResult<number>;
  list_players_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player>;
}

export type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  PlayerFilter,
  QueryOptions,
  AsyncResult,
  PaginatedAsyncResult,
};
