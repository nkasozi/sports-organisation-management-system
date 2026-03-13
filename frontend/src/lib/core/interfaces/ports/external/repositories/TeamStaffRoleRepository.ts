import type { Repository, QueryOptions } from "./Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../../../../entities/TeamStaffRole";

export interface TeamStaffRoleFilter {
  name_contains?: string;
  category?: TeamStaffRole["category"];
  status?: TeamStaffRole["status"];
  organization_id?: string;
}

export interface TeamStaffRoleRepository extends Repository<
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
  TeamStaffRoleFilter
> {
  find_by_category(
    category: TeamStaffRole["category"],
  ): AsyncResult<TeamStaffRole[]>;
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaffRole>;
}

export type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
};
