import type {
  CreateTeamStaffInput,
  TeamStaff,
  UpdateTeamStaffInput,
} from "../../../../entities/TeamStaff";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { AsyncResult } from "../../../../types/Result";
import type { Repository } from "./Repository";

export interface TeamStaffFilter {
  organization_id?: ScalarValueInput<TeamStaff["organization_id"]>;
  name_contains?: string;
  team_id?: ScalarValueInput<TeamStaff["team_id"]>;
  role_id?: ScalarValueInput<TeamStaff["role_id"]>;
  status?: TeamStaff["status"];
}

export interface TeamStaffRepository extends Repository<
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
  TeamStaffFilter
> {
  find_by_team(
    team_id: ScalarValueInput<TeamStaff["team_id"]>,
  ): AsyncResult<TeamStaff[]>;
  find_by_role(
    role_id: ScalarValueInput<TeamStaff["role_id"]>,
  ): AsyncResult<TeamStaff[]>;
}

export type { CreateTeamStaffInput, TeamStaff, UpdateTeamStaffInput };
