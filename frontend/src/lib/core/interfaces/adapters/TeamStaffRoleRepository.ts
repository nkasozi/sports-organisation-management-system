import type { Repository } from "./Repository";
import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../../entities/TeamStaffRole";

export interface TeamStaffRoleFilter {
  name_contains?: string;
  category?: TeamStaffRole["category"];
  status?: TeamStaffRole["status"];
}

export interface TeamStaffRoleRepository extends Repository<
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput
> {
  find_by_category(
    category: TeamStaffRole["category"],
  ): Promise<TeamStaffRole[]>;
}

export type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
};
