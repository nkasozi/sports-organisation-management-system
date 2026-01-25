import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult, AsyncResult } from "../../types/Result";
import type {
  TeamProfile,
  CreateTeamProfileInput,
  UpdateTeamProfileInput,
  ProfileVisibility,
} from "../../entities/TeamProfile";
import type { EntityStatus } from "../../entities/BaseEntity";

export interface TeamProfileFilter {
  team_id?: string;
  visibility?: ProfileVisibility;
  status?: EntityStatus;
}

export interface TeamProfileRepository extends FilterableRepository<
  TeamProfile,
  CreateTeamProfileInput,
  UpdateTeamProfileInput,
  TeamProfileFilter
> {
  find_by_team_id(team_id: string): AsyncResult<TeamProfile>;
  find_by_slug(slug: string): AsyncResult<TeamProfile>;
  find_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamProfile>;
}
