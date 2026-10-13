import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./caller_scope";
import { filter_records_for_caller } from "./scoped_record_reader";
import { select_records_in_clear_scope } from "./sync_admin_support";
import {
  type AllowedSyncTable,
  get_entity_type_for_table,
} from "./sync_table_catalog";
import {
  get_table_tenancy_strategy,
  TableTenancyStrategy,
} from "./table_tenancy";

export const ClearScanPlanKind = {
  FULL_TABLE: "full_table",
  ORGANIZATION_INDEX: "organization_index",
  NOTHING_CLEARABLE: "nothing_clearable",
} as const;

export type ClearScanPlan =
  | { kind: typeof ClearScanPlanKind.FULL_TABLE }
  | {
      kind: typeof ClearScanPlanKind.ORGANIZATION_INDEX;
      organization_id: string;
    }
  | { kind: typeof ClearScanPlanKind.NOTHING_CLEARABLE };

function plan_organization_clear_scan(
  table_name: AllowedSyncTable,
  organization_id: string,
): ClearScanPlan {
  switch (get_table_tenancy_strategy(table_name)) {
    case TableTenancyStrategy.SHARED_REFERENCE:
    case TableTenancyStrategy.ORGANIZATION_IDENTITY:
      return { kind: ClearScanPlanKind.NOTHING_CLEARABLE };
    case TableTenancyStrategy.ORGANIZATION_FIELD:
      return { kind: ClearScanPlanKind.ORGANIZATION_INDEX, organization_id };
    case TableTenancyStrategy.PARENT_SCOPED:
      return { kind: ClearScanPlanKind.FULL_TABLE };
  }
}

export function plan_clear_scan(
  caller: SystemUserRecord,
  table_name: AllowedSyncTable,
): ClearScanPlan {
  const caller_scope = resolve_caller_scope(caller);
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return { kind: ClearScanPlanKind.FULL_TABLE };
    case CallerScopeKind.NONE:
      return { kind: ClearScanPlanKind.NOTHING_CLEARABLE };
    case CallerScopeKind.ORGANIZATION:
      return plan_organization_clear_scan(
        table_name,
        caller_scope.organization_id,
      );
  }
}

interface ClearScopeCommand<TRecord> {
  records: TRecord[];
  caller: SystemUserRecord;
  table_name: AllowedSyncTable;
}

async function select_organization_clearable_records<
  TRecord extends Record<string, unknown>,
>(
  ctx: { db: QueryCtx["db"] },
  command: ClearScopeCommand<TRecord>,
): Promise<TRecord[]> {
  switch (get_table_tenancy_strategy(command.table_name)) {
    case TableTenancyStrategy.SHARED_REFERENCE:
    case TableTenancyStrategy.ORGANIZATION_IDENTITY:
      return [];
    case TableTenancyStrategy.ORGANIZATION_FIELD:
      return select_records_in_clear_scope(
        command.records,
        command.caller,
        get_entity_type_for_table(command.table_name),
      );
    case TableTenancyStrategy.PARENT_SCOPED:
      return filter_records_for_caller(ctx, command);
  }
}

export async function select_clearable_records<
  TRecord extends Record<string, unknown>,
>(
  ctx: { db: QueryCtx["db"] },
  command: ClearScopeCommand<TRecord>,
): Promise<TRecord[]> {
  switch (resolve_caller_scope(command.caller).kind) {
    case CallerScopeKind.GLOBAL:
      return command.records;
    case CallerScopeKind.NONE:
      return [];
    case CallerScopeKind.ORGANIZATION:
      return select_organization_clearable_records(ctx, command);
  }
}
