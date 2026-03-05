import type { Repository } from "./Repository";
import type { AsyncResult } from "../../../../types/Result";
import type {
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
} from "../../../../entities/TeamStaff";

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

export type { TeamStaff, CreateTeamStaffInput, UpdateTeamStaffInput };
