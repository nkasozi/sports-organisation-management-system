import type { EntityStatus } from "../../../../entities/BaseEntity";
import type {
  CreateTeamProfileInput,
  ProfileVisibility,
  TeamProfile,
  UpdateTeamProfileInput,
} from "../../../../entities/TeamProfile";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

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
