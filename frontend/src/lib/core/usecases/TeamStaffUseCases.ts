import type {
  TeamStaffRepository,
  TeamStaffRoleRepository,
  TeamStaffUseCasesPort,
} from "../interfaces/ports";
import {
  create_team_staff,
  delete_team_staff,
  update_team_staff,
} from "./TeamStaffUseCasesMutations";
import {
  get_team_staff_by_id,
  list_staff_by_team,
  list_staff_roles,
  list_team_staff,
} from "./TeamStaffUseCasesQueries";

export type TeamStaffUseCases = TeamStaffUseCasesPort;

export function create_team_staff_use_cases(
  repository: TeamStaffRepository,
  roles_repository: TeamStaffRoleRepository,
): TeamStaffUseCases {
  return {
    list: (filter, pagination) =>
      list_team_staff(repository, filter ?? {}, pagination ?? {}),
    get_by_id: (id) => get_team_staff_by_id(repository, id),
    create: (input) => create_team_staff(repository, input),
    update: (id, input) => update_team_staff(repository, id, input),
    delete: (id) => delete_team_staff(repository, id),
    list_staff_by_team: (team_id) => list_staff_by_team(repository, team_id),
    list_staff_roles: () => list_staff_roles(roles_repository),
  };
}
