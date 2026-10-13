import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import {
  type CallerOwnership,
  create_database_ownership_loader,
  load_caller_ownership,
  resolve_ownership_role_kind,
} from "./caller_ownership";
import { check_entity_permission, DataAction } from "./permission_checks";
import {
  apply_role_read_policy,
  resolve_role_read_policy,
  RoleReadPolicyKind,
} from "./role_read_policy";
import { filter_records_for_caller } from "./scoped_record_reader";
import {
  type AllowedSyncTable,
  get_entity_type_for_table,
  is_global_table,
} from "./sync_table_catalog";
import { SYSTEM_USERS_TABLE_NAME } from "./system_user_constants";

const EMAIL_FIELD_NAME = "email";
const READ_DENIED_EVENT = "sync_read_permission_denied";

interface ReadAuthorizationCommand<TRecord> {
  caller: SystemUserRecord;
  table_name: AllowedSyncTable;
  records: TRecord[];
}

export function can_caller_read_table(
  caller: SystemUserRecord,
  table_name: AllowedSyncTable,
): boolean {
  return (
    is_global_table(table_name) ||
    check_entity_permission(
      caller.role,
      get_entity_type_for_table(table_name),
      DataAction.READ,
    )
  );
}

function select_records_without_read_permission<
  TRecord extends Record<string, unknown>,
>(command: ReadAuthorizationCommand<TRecord>): TRecord[] {
  if (command.table_name === SYSTEM_USERS_TABLE_NAME)
    return command.records.filter(
      (record) => record[EMAIL_FIELD_NAME] === command.caller.email,
    );
  console.warn("[SyncRead] Table read denied for role", {
    event: READ_DENIED_EVENT,
    table_name: command.table_name,
    role: command.caller.role,
  });
  return [];
}

async function load_ownership_for_policy(
  ctx: { db: QueryCtx["db"] },
  caller: SystemUserRecord,
): Promise<CallerOwnership> {
  return load_caller_ownership(create_database_ownership_loader(ctx), caller);
}

export async function authorize_records_for_reader<
  TRecord extends Record<string, unknown>,
>(
  ctx: { db: QueryCtx["db"] },
  command: ReadAuthorizationCommand<TRecord>,
): Promise<TRecord[]> {
  if (is_global_table(command.table_name)) return command.records;
  if (!can_caller_read_table(command.caller, command.table_name))
    return select_records_without_read_permission(command);
  const scoped_records = await filter_records_for_caller(ctx, command);
  const policy = resolve_role_read_policy(
    resolve_ownership_role_kind(command.caller.role),
    command.table_name,
  );
  if (
    policy.kind === RoleReadPolicyKind.ALL_RECORDS ||
    scoped_records.length === 0
  )
    return scoped_records;
  return apply_role_read_policy(
    policy,
    scoped_records,
    await load_ownership_for_policy(ctx, command.caller),
  );
}
