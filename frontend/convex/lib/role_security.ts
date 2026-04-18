import type { ConvexResult } from "./auth_middleware";

const SUPER_ADMIN_ROLE = "super_admin";

type RoleHierarchyLevel = number;

const ROLE_HIERARCHY: Record<string, RoleHierarchyLevel> = {
  super_admin: 100,
  org_admin: 80,
  officials_manager: 60,
  team_manager: 50,
  official: 30,
  player: 20,
  public_viewer: 10,
};

export function can_caller_assign_role(
  caller_role: string,
  target_role: string,
): ConvexResult<true> {
  const caller_role_exists = Object.prototype.hasOwnProperty.call(
    ROLE_HIERARCHY,
    caller_role,
  );
  if (!caller_role_exists) {
    return { success: false, error: "Unknown caller role" };
  }

  const target_role_exists = Object.prototype.hasOwnProperty.call(
    ROLE_HIERARCHY,
    target_role,
  );
  if (!target_role_exists) {
    return { success: false, error: "Unknown target role" };
  }

  const caller_level = ROLE_HIERARCHY[caller_role];
  const target_level = ROLE_HIERARCHY[target_role];

  if (caller_level <= target_level) {
    return {
      success: false,
      error: "Cannot assign a role equal to or higher than own role",
    };
  }

  return { success: true, data: true };
}

export function is_seed_super_admin_allowed(
  caller_role: string,
  existing_super_admin_count: number,
): ConvexResult<true> {
  if (existing_super_admin_count === 0) {
    return { success: true, data: true };
  }

  if (caller_role !== SUPER_ADMIN_ROLE) {
    return {
      success: false,
      error: "Only existing super admins can seed new super admin accounts",
    };
  }

  return { success: true, data: true };
}
