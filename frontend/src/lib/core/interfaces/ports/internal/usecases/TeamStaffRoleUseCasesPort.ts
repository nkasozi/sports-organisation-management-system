import type {
  CreateTeamStaffRoleInput,
  TeamStaffRole,
  UpdateTeamStaffRoleInput,
} from "../../../../entities/TeamStaffRole";
import type { AsyncResult } from "../../../../types/Result";
import type { TeamStaffRoleFilter } from "../../external/repositories/TeamStaffRoleRepository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface TeamStaffRoleUseCasesPort extends BaseUseCasesPort<
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
  TeamStaffRoleFilter
> {
  list_roles_by_category(
    category: TeamStaffRole["category"],
  ): AsyncResult<TeamStaffRole[]>;
}
