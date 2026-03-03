import type {
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
} from "../../../../entities/TeamStaff";
import type { TeamStaffRole } from "../../../../entities/TeamStaffRole";
import type { TeamStaffFilter } from "../../external/repositories/TeamStaffRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { AsyncResult, PaginatedResult } from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface TeamStaffUseCasesPort extends BaseUseCasesPort<
  TeamStaff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
  TeamStaffFilter
> {
  list_staff_by_team(
    team_id: string,
    options?: QueryOptions,
  ): AsyncResult<PaginatedResult<TeamStaff>>;
  list_staff_roles(): AsyncResult<TeamStaffRole[]>;
}
