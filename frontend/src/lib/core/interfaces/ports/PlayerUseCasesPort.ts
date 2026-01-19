import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../../entities/Player";
import type { PlayerFilter } from "../adapters/PlayerRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../entities/BaseEntity";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface PlayerUseCasesPort extends BaseUseCasesPort<
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  PlayerFilter
> {
  delete_players(ids: string[]): Promise<AsyncResult<number>>;
  list_players_by_team(
    team_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Player>>;
}

export type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  PlayerFilter,
  QueryOptions,
  AsyncResult,
  PaginatedAsyncResult,
  EntityOperationResult,
  EntityListResult,
};
