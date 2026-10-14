import type { MutationCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { resolve_caller_scope } from "./caller_scope";
import { normalize_email_address } from "./email_normalization";
import { create_some_option, type Option, OptionStatus } from "./option";
import {
  evaluate_system_user_change,
  type SystemUserChange,
  SystemUserChangeKind,
  SystemUserChangeStatus,
} from "./system_user_change_policy";
import {
  count_active_super_admins,
  is_email_registered,
  merge_requested_snapshot,
  to_system_user_snapshot,
} from "./system_user_policy_context";
import { is_non_empty_string, is_string } from "./value_guards";

const DEFAULT_CREATED_USER_ROLE = "player";
const EMAIL_FIELD_NAME = "email";
const ROLE_FIELD_NAME = "role";

export const SystemUserWriteStatus = {
  ALLOWED: "allowed",
  MISSING_EMAIL: "missing_email",
  PRIVILEGE_CHANGE_BLOCKED: "privilege_change_blocked",
} as const;

type SystemUserWriteOutcome =
  | {
      status: typeof SystemUserWriteStatus.ALLOWED;
      record_data: Record<string, unknown>;
    }
  | { status: typeof SystemUserWriteStatus.MISSING_EMAIL }
  | {
      status: typeof SystemUserWriteStatus.PRIVILEGE_CHANGE_BLOCKED;
      reason: string;
    };

function has_email(record: Record<string, unknown>): boolean {
  const email = record[EMAIL_FIELD_NAME];
  return is_non_empty_string(email);
}

function with_default_role(
  record: Record<string, unknown>,
): Record<string, unknown> {
  return record[ROLE_FIELD_NAME]
    ? record
    : { ...record, [ROLE_FIELD_NAME]: DEFAULT_CREATED_USER_ROLE };
}

function with_normalized_email(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const email = record[EMAIL_FIELD_NAME];
  return is_string(email)
    ? { ...record, [EMAIL_FIELD_NAME]: normalize_email_address(email) }
    : record;
}

function prepare_incoming_record(
  incoming_record: Option<Record<string, unknown>>,
  is_create: boolean,
): Option<Record<string, unknown>> {
  if (incoming_record.status === OptionStatus.NONE) return incoming_record;
  const normalized = with_normalized_email(incoming_record.value);
  return create_some_option(
    is_create ? with_default_role(normalized) : normalized,
  );
}

async function build_system_user_change(
  ctx: MutationCtx,
  incoming_record: Option<Record<string, unknown>>,
  existing_record: Option<Record<string, unknown>>,
): Promise<SystemUserChange> {
  if (existing_record.status === OptionStatus.NONE) {
    const requested = to_system_user_snapshot(
      incoming_record.status === OptionStatus.SOME ? incoming_record.value : {},
    );
    return {
      kind: SystemUserChangeKind.CREATE,
      requested,
      email_already_registered: await is_email_registered(ctx, requested.email),
    };
  }
  const current = to_system_user_snapshot(existing_record.value);
  return incoming_record.status === OptionStatus.SOME
    ? {
        kind: SystemUserChangeKind.UPDATE,
        current,
        requested: merge_requested_snapshot(current, incoming_record.value),
      }
    : { kind: SystemUserChangeKind.DELETE, current };
}

export async function guard_system_user_write(
  ctx: MutationCtx,
  command: {
    caller: SystemUserRecord;
    incoming_record: Option<Record<string, unknown>>;
    existing_record: Option<Record<string, unknown>>;
  },
): Promise<SystemUserWriteOutcome> {
  const incoming_record = prepare_incoming_record(
    command.incoming_record,
    command.existing_record.status === OptionStatus.NONE,
  );
  if (
    incoming_record.status === OptionStatus.SOME &&
    !has_email(incoming_record.value)
  )
    return { status: SystemUserWriteStatus.MISSING_EMAIL };
  const decision = evaluate_system_user_change({
    caller: to_system_user_snapshot({ ...command.caller }),
    caller_scope: resolve_caller_scope(command.caller),
    change: await build_system_user_change(
      ctx,
      incoming_record,
      command.existing_record,
    ),
    active_super_admin_count: await count_active_super_admins(ctx),
  });
  if (decision.status === SystemUserChangeStatus.REJECTED)
    return {
      status: SystemUserWriteStatus.PRIVILEGE_CHANGE_BLOCKED,
      reason: decision.rejection,
    };
  return {
    status: SystemUserWriteStatus.ALLOWED,
    record_data:
      incoming_record.status === OptionStatus.SOME ? incoming_record.value : {},
  };
}
