import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult, AsyncResult } from "../../types/Result";
import type {
  PlayerProfile,
  CreatePlayerProfileInput,
  UpdatePlayerProfileInput,
  ProfileVisibility,
} from "../../entities/PlayerProfile";
import type { EntityStatus } from "../../entities/BaseEntity";

export interface PlayerProfileFilter {
  player_id?: string;
  visibility?: ProfileVisibility;
  status?: EntityStatus;
}

export interface PlayerProfileRepository extends FilterableRepository<
  PlayerProfile,
  CreatePlayerProfileInput,
  UpdatePlayerProfileInput,
  PlayerProfileFilter
> {
  find_by_player_id(player_id: string): AsyncResult<PlayerProfile>;
  find_by_slug(slug: string): AsyncResult<PlayerProfile>;
  find_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerProfile>;
}
