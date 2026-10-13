import type { SharedUserRole } from "../shared_permission_definitions";
import { OptionStatus } from "./option";
import { parse_user_role } from "./permission_checks";

type RoleHierarchyLevel = number;

const ROLE_HIERARCHY: Record<SharedUserRole, RoleHierarchyLevel> = {
  super_admin: 100,
  org_admin: 80,
  officials_manager: 60,
  team_manager: 50,
  official: 30,
  player: 20,
  public_viewer: 10,
};

const RoleAssignmentRejection = {
  UNKNOWN_CALLER_ROLE: "unknown_caller_role",
  UNKNOWN_TARGET_ROLE: "unknown_target_role",
  TARGET_NOT_BELOW_CALLER: "target_not_below_caller",
} as const;

type RoleAssignmentRejectionValue =
  (typeof RoleAssignmentRejection)[keyof typeof RoleAssignmentRejection];

type RoleAssignmentDecision =
  | { success: true }
  | { success: false; rejection: RoleAssignmentRejectionValue };

export function can_caller_assign_role(
  caller_role: string,
  target_role: string,
): RoleAssignmentDecision {
  const parsed_caller_role = parse_user_role(caller_role);
  if (parsed_caller_role.status === OptionStatus.NONE)
    return {
      success: false,
      rejection: RoleAssignmentRejection.UNKNOWN_CALLER_ROLE,
    };
  const parsed_target_role = parse_user_role(target_role);
  if (parsed_target_role.status === OptionStatus.NONE)
    return {
      success: false,
      rejection: RoleAssignmentRejection.UNKNOWN_TARGET_ROLE,
    };
  const caller_level = ROLE_HIERARCHY[parsed_caller_role.value];
  const target_level = ROLE_HIERARCHY[parsed_target_role.value];
  return caller_level > target_level
    ? { success: true }
    : {
        success: false,
        rejection: RoleAssignmentRejection.TARGET_NOT_BELOW_CALLER,
      };
}
