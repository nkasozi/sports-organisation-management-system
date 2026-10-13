import { CallerScopeKind } from "./caller_scope";
import {
  ALLOWED_DECISION,
  check_global_scope_reserved,
  check_last_super_admin_kept,
  check_organization_in_scope,
  check_role_assignable,
  check_target_manageable,
  first_rejection,
  is_active_super_admin,
  is_same_privilege,
} from "./system_user_change_rules";
import {
  type SystemUserChangeCommand,
  type SystemUserChangeDecision,
  SystemUserChangeKind,
  SystemUserChangeRejection,
  type SystemUserSnapshot,
} from "./system_user_change_types";

export {
  type SystemUserChange,
  SystemUserChangeKind,
  SystemUserChangeRejection,
  SystemUserChangeStatus,
  type SystemUserSnapshot,
} from "./system_user_change_types";

function evaluate_create(
  command: SystemUserChangeCommand,
  requested: SystemUserSnapshot,
  email_already_registered: boolean,
): SystemUserChangeDecision {
  return first_rejection([
    email_already_registered ? SystemUserChangeRejection.DUPLICATE_EMAIL : true,
    check_global_scope_reserved(command.caller_scope, requested),
    check_organization_in_scope(
      command.caller_scope,
      requested.organization_id,
    ),
    check_role_assignable(command, requested.role),
  ]);
}

function evaluate_managed_update(
  command: SystemUserChangeCommand,
  current: SystemUserSnapshot,
  requested: SystemUserSnapshot,
): SystemUserChangeDecision {
  return first_rejection([
    current.email === requested.email ||
    command.caller_scope.kind === CallerScopeKind.GLOBAL
      ? true
      : SystemUserChangeRejection.IDENTITY_CHANGE,
    check_target_manageable(command, current.role),
    current.role === requested.role
      ? true
      : check_role_assignable(command, requested.role),
    check_global_scope_reserved(command.caller_scope, requested),
    check_organization_in_scope(command.caller_scope, current.organization_id),
    check_organization_in_scope(
      command.caller_scope,
      requested.organization_id,
    ),
    check_last_super_admin_kept(
      command,
      current,
      is_active_super_admin(requested),
    ),
  ]);
}

function evaluate_delete(
  command: SystemUserChangeCommand,
  current: SystemUserSnapshot,
): SystemUserChangeDecision {
  if (current.email === command.caller.email)
    return first_rejection([SystemUserChangeRejection.SELF_PRIVILEGE_CHANGE]);
  return first_rejection([
    check_target_manageable(command, current.role),
    check_organization_in_scope(command.caller_scope, current.organization_id),
    check_last_super_admin_kept(command, current, false),
  ]);
}

export function evaluate_system_user_change(
  command: SystemUserChangeCommand,
): SystemUserChangeDecision {
  const change = command.change;
  switch (change.kind) {
    case SystemUserChangeKind.CREATE:
      return evaluate_create(
        command,
        change.requested,
        change.email_already_registered,
      );
    case SystemUserChangeKind.UPDATE:
      if (change.current.email !== command.caller.email)
        return evaluate_managed_update(
          command,
          change.current,
          change.requested,
        );
      return is_same_privilege(change.current, change.requested)
        ? ALLOWED_DECISION
        : first_rejection([SystemUserChangeRejection.SELF_PRIVILEGE_CHANGE]);
    case SystemUserChangeKind.DELETE:
      return evaluate_delete(command, change.current);
  }
}
