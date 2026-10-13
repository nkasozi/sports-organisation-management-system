import type { SystemUserRecord } from "./auth_middleware";
import {
  CallerScopeKind,
  GLOBAL_ORGANIZATION_ID,
  resolve_caller_scope,
} from "./caller_scope";
import { is_parent_scoped_table } from "./parent_reference_specs";
import { is_global_table } from "./sync_table_catalog";
import { SYSTEM_USERS_TABLE_NAME } from "./system_user_constants";
import { read_string_or } from "./value_guards";

export {
  ALLOWED_SYNC_TABLES,
  type AllowedSyncTable,
  get_entity_type_for_table,
  is_global_table,
  is_public_table,
  PUBLIC_TABLE_NAMES,
  PUBLIC_TABLES,
  validate_table_name,
} from "./sync_table_catalog";

const EMPTY_SCOPE_VALUE = "";
const ORGANIZATIONS_TABLE_NAME = "organizations";
const TEAM_FIELD_NAME = "team_id";

function get_record_field_value(
  record: Record<string, unknown>,
  field_name: string,
): string {
  const field_value = record[field_name];
  return read_string_or(field_value, EMPTY_SCOPE_VALUE);
}

export function is_global_record(record: Record<string, unknown>): boolean {
  const organization_id = get_record_field_value(record, "organization_id");
  return (
    organization_id === GLOBAL_ORGANIZATION_ID ||
    organization_id === EMPTY_SCOPE_VALUE
  );
}

function filter_caller_own_records(
  records: Array<Record<string, unknown>>,
  caller: SystemUserRecord,
  table_name: string,
): Array<Record<string, unknown>> {
  return table_name === SYSTEM_USERS_TABLE_NAME
    ? records.filter(
        (record) => get_record_field_value(record, "email") === caller.email,
      )
    : [];
}

function is_within_team_scope(
  record: Record<string, unknown>,
  scoped_team_id: string,
): boolean {
  const record_team_id = get_record_field_value(record, TEAM_FIELD_NAME);
  return (
    !scoped_team_id ||
    record_team_id === EMPTY_SCOPE_VALUE ||
    record_team_id === scoped_team_id
  );
}

function filter_records_for_organization(
  records: Array<Record<string, unknown>>,
  table_name: string,
  organization_id: string,
  scoped_team_id: string,
): Array<Record<string, unknown>> {
  if (is_parent_scoped_table(table_name)) return [];
  if (table_name === ORGANIZATIONS_TABLE_NAME)
    return records.filter(
      (record) =>
        get_record_field_value(record, "local_id") === organization_id,
    );
  return records.filter(
    (record) =>
      get_record_field_value(record, "organization_id") === organization_id &&
      is_within_team_scope(record, scoped_team_id),
  );
}

export function filter_records_by_organization_scope(
  records: Array<Record<string, unknown>>,
  caller: SystemUserRecord,
  table_name: string,
  scope_filter: Record<string, string>,
): Array<Record<string, unknown>> {
  if (is_global_table(table_name)) return records;
  const caller_scope = resolve_caller_scope(caller);
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return records;
    case CallerScopeKind.NONE:
      return filter_caller_own_records(records, caller, table_name);
    case CallerScopeKind.ORGANIZATION:
      return filter_records_for_organization(
        records,
        table_name,
        caller_scope.organization_id,
        get_record_field_value(scope_filter, "team_id"),
      );
  }
}
