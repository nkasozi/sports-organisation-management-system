import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./caller_scope";
import { query_table_dynamically, type StoredRow } from "./dynamic_table_query";
import { is_parent_scoped_table } from "./parent_reference_specs";
import { load_parent_scoped_rows } from "./parent_scoped_row_loader";
import { type AllowedSyncTable, is_global_table } from "./sync_table_catalog";
import {
  SYSTEM_USER_EMAIL_INDEX_NAME,
  SYSTEM_USERS_TABLE_NAME,
} from "./system_user_constants";
import {
  get_table_tenancy_strategy,
  TableTenancyStrategy,
} from "./table_tenancy";

export const ORGANIZATION_LOCAL_ID_INDEX = "by_organization_local_id";
export const LOCAL_ID_INDEX = "by_local_id";
const ORGANIZATION_FIELD_NAME = "organization_id";
const LOCAL_ID_FIELD_NAME = "local_id";
const EMAIL_FIELD_NAME = "email";

type DatabaseReader = { db: QueryCtx["db"] };

async function load_reference_rows(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
): Promise<StoredRow[]> {
  return query_table_dynamically(ctx, table_name).collect();
}

export async function load_organization_rows(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
  organization_id: string,
): Promise<StoredRow[]> {
  if (is_parent_scoped_table(table_name))
    return load_parent_scoped_rows(ctx, table_name, (parent_table) =>
      load_organization_rows(ctx, parent_table, organization_id),
    );
  switch (get_table_tenancy_strategy(table_name)) {
    case TableTenancyStrategy.SHARED_REFERENCE:
      return load_reference_rows(ctx, table_name);
    case TableTenancyStrategy.ORGANIZATION_IDENTITY:
      return query_table_dynamically(ctx, table_name)
        .withIndex(LOCAL_ID_INDEX, (range) =>
          range.eq(LOCAL_ID_FIELD_NAME, organization_id),
        )
        .collect();
    case TableTenancyStrategy.ORGANIZATION_FIELD:
    case TableTenancyStrategy.PARENT_SCOPED:
      return query_table_dynamically(ctx, table_name)
        .withIndex(ORGANIZATION_LOCAL_ID_INDEX, (range) =>
          range.eq(ORGANIZATION_FIELD_NAME, organization_id),
        )
        .collect();
  }
}

async function load_rows_without_scope(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
  caller: SystemUserRecord,
): Promise<StoredRow[]> {
  if (is_global_table(table_name)) return load_reference_rows(ctx, table_name);
  if (table_name !== SYSTEM_USERS_TABLE_NAME) return [];
  return query_table_dynamically(ctx, table_name)
    .withIndex(SYSTEM_USER_EMAIL_INDEX_NAME, (range) =>
      range.eq(EMAIL_FIELD_NAME, caller.email),
    )
    .collect();
}

export async function load_rows_in_caller_scope(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
  caller: SystemUserRecord,
): Promise<StoredRow[]> {
  const caller_scope = resolve_caller_scope(caller);
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return query_table_dynamically(ctx, table_name).collect();
    case CallerScopeKind.NONE:
      return load_rows_without_scope(ctx, table_name, caller);
    case CallerScopeKind.ORGANIZATION:
      return load_organization_rows(
        ctx,
        table_name,
        caller_scope.organization_id,
      );
  }
}
