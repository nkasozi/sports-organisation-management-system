import type { UserRole } from "$lib/core/interfaces/ports/external/iam/AuthenticationPort";

export const USER_ROLE = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin",
  OFFICIALS_MANAGER: "officials_manager",
  TEAM_MANAGER: "team_manager",
  OFFICIAL: "official",
  PLAYER: "player",
  PUBLIC_VIEWER: "public_viewer",
} as const satisfies Record<string, UserRole>;

const ORGANIZATION_ADMIN_ROLES: readonly string[] = [
  USER_ROLE.SUPER_ADMIN,
  USER_ROLE.ORG_ADMIN,
];

export function is_organization_admin_role(role: string): boolean {
  return ORGANIZATION_ADMIN_ROLES.includes(role);
}
