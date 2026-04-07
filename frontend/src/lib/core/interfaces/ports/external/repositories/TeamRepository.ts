import type {
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "../../../../entities/Team";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface TeamFilter {
  name_contains?: string;
  organization_id?: string;
  status?: Team["status"];
}

export interface TeamRepository extends FilterableRepository<
  Team,
  CreateTeamInput,
  UpdateTeamInput,
  TeamFilter
> {
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Team>;
  find_active_teams(options?: QueryOptions): PaginatedAsyncResult<Team>;
}
