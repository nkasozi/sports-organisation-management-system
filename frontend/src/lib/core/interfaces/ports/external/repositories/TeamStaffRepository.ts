import type {
  CreateTeamStaffInput,
  TeamStaff,
  UpdateTeamStaffInput,
} from "../../../../entities/TeamStaff";
import type { AsyncResult } from "../../../../types/Result";
import type { Repository } from "./Repository";

export interface TeamStaffFilter {
  organization_id?: string;
  name_contains?: string;
  team_id?: string;
  role_id?: string;
  status?: TeamStaff["status"];
}

export interface TeamStaffRepository extends Repository<
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
  TeamStaffFilter
> {
  find_by_team(team_id: string): AsyncResult<TeamStaff[]>;
  find_by_role(role_id: string): AsyncResult<TeamStaff[]>;
}

export type { CreateTeamStaffInput, TeamStaff, UpdateTeamStaffInput };
