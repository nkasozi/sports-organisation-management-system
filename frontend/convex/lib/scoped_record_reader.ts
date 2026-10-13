import type { QueryCtx } from "../_generated/server";
import { build_scope_filter, type SystemUserRecord } from "./auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./caller_scope";
import {
  ParentResolutionKind,
  resolve_parent_organization,
} from "./parent_organization_resolution";
import {
  create_database_parent_row_loader,
  load_parent_record_lookup,
} from "./parent_record_loading";
import { is_parent_scoped_table } from "./parent_reference_specs";
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
  if (is_global_table(table_name)) return records;
  const caller_scope = resolve_caller_scope(caller);
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
  const lookup = await load_parent_record_lookup(
    create_database_parent_row_loader(ctx),
    table_name,
    records,
  );
  return records.filter((record) => {
    const resolution = resolve_parent_organization(table_name, record, lookup);
    return (
      resolution.kind === ParentResolutionKind.RESOLVED_ORGANIZATION &&
      resolution.organization_id === caller_scope.organization_id
    );
  });
}
