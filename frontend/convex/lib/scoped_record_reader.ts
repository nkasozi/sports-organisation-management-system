import type { QueryCtx } from "../_generated/server";
import { build_scope_filter, type SystemUserRecord } from "./auth_middleware";
import {
  CallerScopeKind,
  filter_global_table_records,
  resolve_caller_scope,
} from "./caller_scope";
import {
  ParentResolutionKind,
  resolve_parent_organization,
} from "./parent_organization_resolution";
import {
  create_database_parent_row_loader,
  load_parent_record_lookup,
} from "./parent_record_loading";
import {
  is_parent_scoped_table,
  type ParentScopedTable,
} from "./parent_reference_specs";
import {
  filter_records_by_organization_scope,
  get_entity_type_for_table,
  is_global_table,
} from "./sync_validation";

interface ScopedRecordFilterCommand<TRecord> {
  records: TRecord[];
  caller: SystemUserRecord;
  table_name: string;
}

export async function filter_records_for_caller<
  TRecord extends Record<string, unknown>,
>(
  ctx: { db: QueryCtx["db"] },
  command: ScopedRecordFilterCommand<TRecord>,
): Promise<TRecord[]> {
  const { records, caller, table_name } = command;
  const caller_scope = resolve_caller_scope(caller);
  if (is_global_table(table_name))
    return filter_global_table_records(records, caller_scope);
  if (
    !is_parent_scoped_table(table_name) ||
    caller_scope.kind !== CallerScopeKind.ORGANIZATION
  )
    return filter_records_by_organization_scope(
      records,
      caller,
      table_name,
      build_scope_filter(caller, get_entity_type_for_table(table_name)),
    ) as TRecord[];
  return filter_parent_scoped_records_for_organization(ctx, {
    table_name,
    records,
    organization_id: caller_scope.organization_id,
  });
}

export async function filter_parent_scoped_records_for_organization<
  TRecord extends Record<string, unknown>,
>(
  ctx: { db: QueryCtx["db"] },
  command: {
    table_name: ParentScopedTable;
    records: TRecord[];
    organization_id: string;
  },
): Promise<TRecord[]> {
  const lookup = await load_parent_record_lookup(
    create_database_parent_row_loader(ctx),
    command.table_name,
    command.records,
  );
  return command.records.filter((record) => {
    const resolution = resolve_parent_organization(
      command.table_name,
      record,
      lookup,
    );
    return (
      resolution.kind === ParentResolutionKind.RESOLVED_ORGANIZATION &&
      resolution.organization_id === command.organization_id
    );
  });
}
