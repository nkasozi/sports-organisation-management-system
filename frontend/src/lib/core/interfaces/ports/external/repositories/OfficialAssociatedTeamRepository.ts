import type {
  CreateOfficialAssociatedTeamInput,
  OfficialAssociatedTeam,
  UpdateOfficialAssociatedTeamInput,
} from "../../../../entities/OfficialAssociatedTeam";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

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
