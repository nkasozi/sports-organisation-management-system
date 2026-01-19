import type { Repository } from "./Repository";
import type {
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
} from "../../entities/TeamStaff";

export interface TeamStaffFilter {
  name_contains?: string;
  team_id?: string;
  role_id?: string;
  status?: TeamStaff["status"];
}

export interface TeamStaffRepository extends Repository<
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput
> {
  find_by_team(team_id: string): Promise<TeamStaff[]>;
  find_by_role(role_id: string): Promise<TeamStaff[]>;
}

export type { TeamStaff, CreateTeamStaffInput, UpdateTeamStaffInput };
