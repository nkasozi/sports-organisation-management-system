import type { Repository, QueryOptions } from "./Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
} from "../../../../entities/GameOfficialRole";

export interface GameOfficialRoleFilter {
  name_contains?: string;
  sport_id?: string | null;
  is_on_field?: boolean;
  is_head_official?: boolean;
  status?: GameOfficialRole["status"];
  organization_id?: string;
}

export interface GameOfficialRoleRepository extends Repository<
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
  GameOfficialRoleFilter
> {
  find_by_sport(sport_id: string | null): AsyncResult<GameOfficialRole[]>;
  find_head_officials(): AsyncResult<GameOfficialRole[]>;
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole>;
}

export type {
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
};
