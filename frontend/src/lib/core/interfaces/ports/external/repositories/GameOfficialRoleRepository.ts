import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
} from "../../../../entities/GameOfficialRole";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface GameOfficialRoleFilter {
  name_contains?: string;
  sport_id?: ScalarValueInput<GameOfficialRole["sport_id"]>;
  is_on_field?: boolean;
  is_head_official?: boolean;
  status?: GameOfficialRole["status"];
  organization_id?: ScalarValueInput<GameOfficialRole["organization_id"]>;
}

export interface GameOfficialRoleRepository extends Repository<
  GameOfficialRole,
  CreateGameOfficialRoleInput,
  UpdateGameOfficialRoleInput,
  GameOfficialRoleFilter
> {
  find_by_sport(
    sport_id: ScalarValueInput<GameOfficialRole["sport_id"]>,
  ): AsyncResult<GameOfficialRole[]>;
  find_head_officials(): AsyncResult<GameOfficialRole[]>;
  find_by_organization(
    organization_id: ScalarValueInput<GameOfficialRole["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole>;
}

export type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
};
