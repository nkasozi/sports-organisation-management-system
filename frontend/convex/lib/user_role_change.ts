import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { SystemUser } from "../authorization_helpers";
import { resolve_caller_scope } from "./caller_scope";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import { refresh_ownership_dependents } from "./ownership_refresh";
import {
  find_role_reference_rejection,
  type RoleReferenceField,
} from "./role_assignment_references";
import { schedule_security_audit } from "./security_audit_scheduler";
import { SecurityEventType } from "./security_event_types";
import {
  create_versioned_change_fields,
  SYSTEM_USERS_SYNC_TABLE,
} from "./sync_change_stamp";
import {
  evaluate_system_user_change,
  SystemUserChangeKind,
  SystemUserChangeStatus,
} from "./system_user_change_policy";
import { SYSTEM_USER_ENTITY_TYPE } from "./system_user_constants";
import {
  count_active_super_admins,
  to_system_user_snapshot,
} from "./system_user_policy_context";
import { is_string } from "./value_guards";

const EMPTY_FIELD_VALUE = "";

interface UserRoleChangeRequest {
  role: string;
  organization_id: Option<string>;
  references: Record<RoleReferenceField, Option<string>>;
}

export interface UserRoleChangeCommand {
  caller: SystemUser;
  target_user: Doc<"system_users">;
  request: UserRoleChangeRequest;
}

export function option_from_argument(
  value: string | undefined,
): Option<string> {
  return is_string(value) ? create_some_option(value) : create_none_option();
}

function value_or(option: Option<string>, current_value: string): string {
  return option.status === OptionStatus.SOME ? option.value : current_value;
}

function resolve_target_organization(command: UserRoleChangeCommand): string {
  return value_or(
    command.request.organization_id,
    command.target_user.organization_id ?? EMPTY_FIELD_VALUE,
  );
}

function build_supplied_reference_patch(
  references: Record<RoleReferenceField, Option<string>>,
): Partial<Record<RoleReferenceField, string>> {
  const reference_patch: Partial<Record<RoleReferenceField, string>> = {};
  for (const [field_name, reference] of Object.entries(references) as Array<
    [RoleReferenceField, Option<string>]
  >) {
    if (reference.status === OptionStatus.SOME)
      reference_patch[field_name] = reference.value;
  }
  return reference_patch;
}

async function audit_blocked_role_change(
  ctx: MutationCtx,
  command: UserRoleChangeCommand,
  audit: { event_type: string; rejection: string },
): Promise<boolean> {
  return schedule_security_audit(ctx, {
    event_type: audit.event_type,
    entity_type: SYSTEM_USER_ENTITY_TYPE,
    entity_id: command.target_user.local_id,
    user_email: command.caller.email,
    organization_id: command.caller.organization_id ?? EMPTY_FIELD_VALUE,
    details: `update_user_role blocked: ${audit.rejection}`,
  });
}

async function authorize_privilege_change(
  ctx: MutationCtx,
  command: UserRoleChangeCommand,
): Promise<boolean> {
  const current = to_system_user_snapshot(command.target_user);
  const decision = evaluate_system_user_change({
    caller: to_system_user_snapshot({ ...command.caller }),
    caller_scope: resolve_caller_scope(command.caller),
    change: {
      kind: SystemUserChangeKind.UPDATE,
      current,
      requested: {
        ...current,
        role: command.request.role,
        organization_id: resolve_target_organization(command),
      },
    },
    active_super_admin_count: await count_active_super_admins(ctx),
  });
  if (decision.status === SystemUserChangeStatus.ALLOWED) return true;
  await audit_blocked_role_change(ctx, command, {
    event_type: SecurityEventType.ROLE_ESCALATION_BLOCKED,
    rejection: decision.rejection,
  });
  return false;
}

async function authorize_role_references(
  ctx: MutationCtx,
  command: UserRoleChangeCommand,
): Promise<boolean> {
  const target_organization_id = resolve_target_organization(command);
  const target_user = command.target_user;
  const rejection = await find_role_reference_rejection(ctx, {
    target_organization_id,
    organization_changed:
      target_organization_id !==
      (target_user.organization_id ?? EMPTY_FIELD_VALUE),
    supplied: command.request.references,
    current: {
      team_id: target_user.team_id ?? EMPTY_FIELD_VALUE,
      player_id: target_user.player_id ?? EMPTY_FIELD_VALUE,
      official_id: target_user.official_id ?? EMPTY_FIELD_VALUE,
    },
  });
  if (rejection.status === OptionStatus.NONE) return true;
  await audit_blocked_role_change(ctx, command, {
    event_type: SecurityEventType.ORG_SCOPE_VIOLATION,
    rejection: `${rejection.value.field_name}:${rejection.value.rejection}`,
  });
  return false;
}

export async function authorize_user_role_change(
  ctx: MutationCtx,
  command: UserRoleChangeCommand,
): Promise<boolean> {
  if (!(await authorize_privilege_change(ctx, command))) return false;
  return authorize_role_references(ctx, command);
}

export async function apply_user_role_change(
  ctx: MutationCtx,
  command: UserRoleChangeCommand,
): Promise<boolean> {
  const target_user = command.target_user;
  const organization_id = resolve_target_organization(command);
  const previous_user = { ...target_user };
  const ownership_patch = {
    role: command.request.role,
    organization_id,
    ...build_supplied_reference_patch(command.request.references),
  };
  await ctx.db.patch(target_user._id, {
    ...(await create_versioned_change_fields(ctx, {
      table_name: SYSTEM_USERS_SYNC_TABLE,
      changed_records: [target_user, { organization_id }],
      previous_version: target_user.version,
    })),
    ...ownership_patch,
    updated_at: new Date().toISOString(),
  });
  await refresh_ownership_dependents(ctx, {
    table_name: SYSTEM_USERS_SYNC_TABLE,
    previous_record: create_some_option(previous_user),
    next_record: create_some_option(ownership_patch),
  });
  return true;
}
