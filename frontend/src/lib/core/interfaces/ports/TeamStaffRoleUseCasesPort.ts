import type {
  TeamStaffRole,
  CreateTeamStaffRoleInput,
  UpdateTeamStaffRoleInput,
} from "../../entities/TeamStaffRole";
import type { TeamStaffRoleFilter } from "../adapters/TeamStaffRoleRepository";
import type { AsyncResult } from "../../types/Result";
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
