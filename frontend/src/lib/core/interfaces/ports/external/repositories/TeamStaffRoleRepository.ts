import type { Repository } from "./Repository";
import type { AsyncResult } from "../../../../types/Result";
import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../../../../entities/TeamStaffRole";

export interface TeamStaffRoleFilter {
  name_contains?: string;
  category?: TeamStaffRole["category"];
  status?: TeamStaffRole["status"];
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
}

export type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
};
