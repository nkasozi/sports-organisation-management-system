import {
  type CallerScope,
  CallerScopeKind,
  GLOBAL_ORGANIZATION_ID,
} from "./caller_scope";
import { can_caller_assign_role } from "./role_security";
import {
  type SystemUserChangeCommand,
  type SystemUserChangeDecision,
  SystemUserChangeRejection,
  type SystemUserChangeRejectionValue,
  SystemUserChangeStatus,
  type SystemUserSnapshot,
} from "./system_user_change_types";
import { SUPER_ADMIN_ROLE, SystemUserStatus } from "./system_user_constants";

type RuleOutcome = SystemUserChangeRejectionValue | true;

export const ALLOWED_DECISION: SystemUserChangeDecision = {
  status: SystemUserChangeStatus.ALLOWED,
};

export function first_rejection(
  rule_outcomes: RuleOutcome[],
): SystemUserChangeDecision {
  for (const outcome of rule_outcomes) {
    if (outcome !== true)
      return { status: SystemUserChangeStatus.REJECTED, rejection: outcome };
  }
  return ALLOWED_DECISION;
}

export function is_active_super_admin(user: SystemUserSnapshot): boolean {
  return (
    user.role === SUPER_ADMIN_ROLE && user.status !== SystemUserStatus.INACTIVE
  );
}

export function check_global_scope_reserved(
  caller_scope: CallerScope,
  requested: SystemUserSnapshot,
): RuleOutcome {
  if (requested.organization_id !== GLOBAL_ORGANIZATION_ID) return true;
  const may_hold_global_scope =
    caller_scope.kind === CallerScopeKind.GLOBAL &&
    requested.role === SUPER_ADMIN_ROLE;
  return may_hold_global_scope
    ? true
    : SystemUserChangeRejection.GLOBAL_SCOPE_RESERVED;
}

export function check_organization_in_scope(
  caller_scope: CallerScope,
  organization_id: string,
): RuleOutcome {
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return true;
    case CallerScopeKind.ORGANIZATION:
      return caller_scope.organization_id === organization_id
        ? true
        : SystemUserChangeRejection.ORGANIZATION_OUTSIDE_SCOPE;
    case CallerScopeKind.NONE:
      return SystemUserChangeRejection.ORGANIZATION_OUTSIDE_SCOPE;
  }
}

export function check_role_assignable(
  command: SystemUserChangeCommand,
  role: string,
): RuleOutcome {
  return can_caller_assign_role(command.caller.role, role).success
    ? true
    : SystemUserChangeRejection.ROLE_NOT_ASSIGNABLE;
}

export function check_target_manageable(
  command: SystemUserChangeCommand,
  target_role: string,
): RuleOutcome {
  if (command.caller.role === SUPER_ADMIN_ROLE) return true;
  return can_caller_assign_role(command.caller.role, target_role).success
    ? true
    : SystemUserChangeRejection.TARGET_NOT_BELOW_CALLER;
}

export function check_last_super_admin_kept(
  command: SystemUserChangeCommand,
  current: SystemUserSnapshot,
  remains_active_super_admin: boolean,
): RuleOutcome {
  const removes_super_admin =
    is_active_super_admin(current) && !remains_active_super_admin;
  return removes_super_admin && command.active_super_admin_count <= 1
    ? SystemUserChangeRejection.LAST_SUPER_ADMIN
    : true;
}

export function is_same_privilege(
  current: SystemUserSnapshot,
  requested: SystemUserSnapshot,
): boolean {
  return (
    current.email === requested.email &&
    current.role === requested.role &&
    current.organization_id === requested.organization_id &&
    current.status === requested.status
  );
}
