import type {
  CreatePlayerInput,
  Player,
  UpdatePlayerInput,
} from "../../../../entities/Player";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { PlayerFilter } from "../../external/repositories/PlayerRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface PlayerUseCasesPort extends BaseUseCasesPort<
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  PlayerFilter
> {
  delete_players(ids: Array<ScalarValueInput<Player["id"]>>): AsyncResult<number>;
  list_players_by_team(
    team_id: ScalarValueInput<Player["id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player>;
}

export type {
  AsyncResult,
  CreatePlayerInput,
  PaginatedAsyncResult,
  Player,
  PlayerFilter,
  QueryOptions,
  UpdatePlayerInput,
};
