import type {
  OfficialAssociatedTeam,
  CreateOfficialAssociatedTeamInput,
  UpdateOfficialAssociatedTeamInput,
} from "../../../../entities/OfficialAssociatedTeam";
import type { Repository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../../../types/Result";

export interface OfficialAssociatedTeamFilter {
  official_id?: string;
  team_id?: string;
  association_type?: string;
  status?: string;
}

export interface OfficialAssociatedTeamRepository extends Repository<
  OfficialAssociatedTeam,
  CreateOfficialAssociatedTeamInput,
  UpdateOfficialAssociatedTeamInput,
  OfficialAssociatedTeamFilter
> {
  find_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam>;
  find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam>;
}
