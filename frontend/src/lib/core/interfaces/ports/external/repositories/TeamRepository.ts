import type {
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "../../../../entities/Team";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface TeamFilter {
  name_contains?: string;
  organization_id?: ScalarValueInput<Team["organization_id"]>;
  status?: Team["status"];
}

export interface TeamRepository extends FilterableRepository<
  Team,
  CreateTeamInput,
  UpdateTeamInput,
  TeamFilter
> {
  find_by_organization(
    organization_id: ScalarValueInput<Team["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Team>;
  find_active_teams(options?: QueryOptions): PaginatedAsyncResult<Team>;
}
