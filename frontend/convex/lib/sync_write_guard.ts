import type { MutationCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { resolve_caller_scope } from "./caller_scope";
import { create_none_option, type Option, OptionStatus } from "./option";
import { resolve_write_parent_organizations } from "./parent_write_resolution";
import {
  evaluate_record_write_ownership,
  WriteOwnershipStatus,
} from "./record_write_ownership";
import { find_scoped_write_rejection } from "./scoped_write_guard";
import {
  schedule_security_audit,
  type SecurityAuditEntry,
} from "./security_audit_scheduler";
import {
  type AllowedSyncTable,
  get_entity_type_for_table,
} from "./sync_table_catalog";
import {
  allow_sync_write,
  get_audit_event_type_for_rejection,
  reject_sync_write,
  type SyncWriteDecision,
  SyncWriteRejection,
  SyncWriteStatus,
} from "./sync_write_decision";
import { SYSTEM_USERS_TABLE_NAME } from "./system_user_constants";
import {
  guard_system_user_write,
  SystemUserWriteStatus,
} from "./system_user_write_guard";
import { validate_record_url_fields } from "./url_validation";

const CONVEX_SYSTEM_FIELDS = ["_id", "_creationTime"];
const EMPTY_AUDIT_VALUE = "";

export interface SyncWriteCommand {
  table_name: AllowedSyncTable;
  caller: SystemUserRecord;
  local_id: string;
  incoming_record: Option<Record<string, unknown>>;
  existing_record: Option<Record<string, unknown>>;
}

function strip_convex_system_fields(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized_record = { ...record };
  for (const field_name of CONVEX_SYSTEM_FIELDS)
    delete sanitized_record[field_name];
  return sanitized_record;
}

function sanitize_incoming_record(
  incoming_record: Option<Record<string, unknown>>,
): Option<Record<string, unknown>> {
  return incoming_record.status === OptionStatus.SOME
    ? {
        status: OptionStatus.SOME,
        value: strip_convex_system_fields(incoming_record.value),
      }
    : create_none_option();
}

function has_invalid_urls(
  incoming_record: Option<Record<string, unknown>>,
): boolean {
  return (
    incoming_record.status === OptionStatus.SOME &&
    !validate_record_url_fields(incoming_record.value).is_valid
  );
}

async function guard_system_user_fields(
  ctx: MutationCtx,
  command: SyncWriteCommand,
  normalized_record: Option<Record<string, unknown>>,
): Promise<SyncWriteDecision> {
  const outcome = await guard_system_user_write(ctx, {
    caller: command.caller,
    incoming_record: normalized_record,
    existing_record: command.existing_record,
  });
  switch (outcome.status) {
    case SystemUserWriteStatus.ALLOWED:
      return allow_sync_write(outcome.record_data);
    case SystemUserWriteStatus.MISSING_EMAIL:
      return reject_sync_write(
        SyncWriteRejection.MISSING_EMAIL,
        SyncWriteRejection.MISSING_EMAIL,
      );
    case SystemUserWriteStatus.PRIVILEGE_CHANGE_BLOCKED:
      return reject_sync_write(
        SyncWriteRejection.PRIVILEGE_CHANGE,
        outcome.reason,
      );
  }
}

export async function guard_sync_record_write(
  ctx: MutationCtx,
  command: SyncWriteCommand,
): Promise<SyncWriteDecision> {
  const incoming_record = sanitize_incoming_record(command.incoming_record);
  if (has_invalid_urls(incoming_record))
    return reject_sync_write(
      SyncWriteRejection.INVALID_URL,
      SyncWriteRejection.INVALID_URL,
    );
  const caller_scope = resolve_caller_scope(command.caller);
  const parent_organizations = await resolve_write_parent_organizations(ctx, {
    table_name: command.table_name,
    caller_scope,
    incoming_record,
    existing_record: command.existing_record,
  });
  const ownership = evaluate_record_write_ownership({
    ...command,
    incoming_record,
    caller_scope,
    caller_email: command.caller.email,
    parent_organizations,
  });
  if (ownership.status === WriteOwnershipStatus.REJECTED)
    return reject_sync_write(
      SyncWriteRejection.WRONG_ORGANIZATION,
      ownership.rejection,
    );
  return guard_owned_record_write(ctx, {
    ...command,
    incoming_record,
    normalized_record: ownership.normalized_record,
  });
}

async function guard_owned_record_write(
  ctx: MutationCtx,
  command: SyncWriteCommand & { normalized_record: Record<string, unknown> },
): Promise<SyncWriteDecision> {
  const scope_rejection = await find_scoped_write_rejection(ctx, command);
  if (scope_rejection.status === OptionStatus.SOME)
    return reject_sync_write(scope_rejection.value, scope_rejection.value);
  const normalized_record: Option<Record<string, unknown>> =
    command.incoming_record.status === OptionStatus.SOME
      ? { status: OptionStatus.SOME, value: command.normalized_record }
      : create_none_option();
  if (command.table_name !== SYSTEM_USERS_TABLE_NAME)
    return allow_sync_write(command.normalized_record);
  return guard_system_user_fields(ctx, command, normalized_record);
}

export async function audit_rejected_sync_write(
  ctx: MutationCtx,
  command: SyncWriteCommand,
  decision: SyncWriteDecision,
): Promise<boolean> {
  if (decision.status === SyncWriteStatus.ALLOWED) return false;
  const audit_event_type = get_audit_event_type_for_rejection(
    decision.rejection,
  );
  if (audit_event_type.status === OptionStatus.NONE) return false;
  const entry: SecurityAuditEntry = {
    event_type: audit_event_type.value,
    entity_type: get_entity_type_for_table(command.table_name),
    entity_id: command.local_id,
    user_email: command.caller.email,
    organization_id: command.caller.organization_id ?? EMPTY_AUDIT_VALUE,
    details: `Blocked sync write on ${command.table_name}: ${decision.reason}`,
  };
  return schedule_security_audit(ctx, entry);
}
