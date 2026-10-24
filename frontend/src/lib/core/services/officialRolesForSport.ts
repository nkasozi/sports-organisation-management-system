import {
  type OfficialRequirementSource,
  role_matches_requirement,
} from "./officialRoleSlots";

export interface SportScopedOfficialRole {
  id: string;
  name: string;
  code: string;
  sport_id: string;
}

export interface OfficialRoleSportScope {
  sport_id: string;
  requirements: readonly Pick<
    OfficialRequirementSource,
    "role_id" | "role_name"
  >[];
}

const GENERIC_ROLE_SPORT_ID = "";

function is_generic_role_requested(
  role: SportScopedOfficialRole,
  scope: OfficialRoleSportScope,
): boolean {
  return scope.requirements.some((requirement) =>
    role_matches_requirement(requirement, role),
  );
}

function is_role_for_sport(
  role: SportScopedOfficialRole,
  scope: OfficialRoleSportScope,
  sport_has_own_roles: boolean,
): boolean {
  if (role.sport_id === scope.sport_id) return true;
  if (role.sport_id !== GENERIC_ROLE_SPORT_ID) return false;
  return !sport_has_own_roles || is_generic_role_requested(role, scope);
}

export function filter_official_roles_for_sport<
  T extends SportScopedOfficialRole,
>(command: OfficialRoleSportScope & { roles: readonly T[] }): T[] {
  const sport_has_own_roles = command.roles.some(
    (role) => role.sport_id === command.sport_id,
  );
  return command.roles.filter((role) =>
    is_role_for_sport(role, command, sport_has_own_roles),
  );
}
