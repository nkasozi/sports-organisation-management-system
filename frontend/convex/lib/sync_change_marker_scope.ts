import type { QueryCtx } from "../_generated/server";
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
  read_reference,
} from "./parent_reference_specs";
import {
  classify_record_organization,
  RecordOrganizationKind,
} from "./record_organization";
import type { AllowedSyncTable } from "./sync_table_catalog";
import {
  get_table_tenancy_strategy,
  TableTenancyStrategy,
} from "./table_tenancy";

export const SHARED_RECORDS_SCOPE_KEY = "shared_records";
const LOCAL_ID_FIELD = "local_id";

export const ChangeMarkerScopeKind = {
  TABLE_WIDE_ONLY: "table_wide_only",
  SCOPE_BUCKET: "scope_bucket",
} as const;

export type ChangeMarkerScope =
  | { kind: typeof ChangeMarkerScopeKind.TABLE_WIDE_ONLY }
  | { kind: typeof ChangeMarkerScopeKind.SCOPE_BUCKET; scope_key: string };

const TABLE_WIDE_ONLY_SCOPE: ChangeMarkerScope = {
  kind: ChangeMarkerScopeKind.TABLE_WIDE_ONLY,
};

function bucket_scope(scope_key: string): ChangeMarkerScope {
  return scope_key
    ? { kind: ChangeMarkerScopeKind.SCOPE_BUCKET, scope_key }
    : TABLE_WIDE_ONLY_SCOPE;
}

function resolve_organization_field_scope(
  record: Record<string, unknown>,
): ChangeMarkerScope {
  const organization = classify_record_organization(record);
  switch (organization.kind) {
    case RecordOrganizationKind.ORGANIZATION:
      return bucket_scope(organization.organization_id);
    case RecordOrganizationKind.GLOBAL:
    case RecordOrganizationKind.UNSCOPED:
      return bucket_scope(SHARED_RECORDS_SCOPE_KEY);
  }
}

async function resolve_parent_scoped_scope(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  record: Record<string, unknown>,
): Promise<ChangeMarkerScope> {
  if (!is_parent_scoped_table(table_name)) return TABLE_WIDE_ONLY_SCOPE;
  const lookup = await load_parent_record_lookup(
    create_database_parent_row_loader(ctx),
    table_name,
    [record],
  );
  const resolution = resolve_parent_organization(table_name, record, lookup);
  return resolution.kind === ParentResolutionKind.RESOLVED_ORGANIZATION
    ? bucket_scope(resolution.organization_id)
    : TABLE_WIDE_ONLY_SCOPE;
}

export async function resolve_change_marker_scope(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  record: Record<string, unknown>,
): Promise<ChangeMarkerScope> {
  switch (get_table_tenancy_strategy(table_name)) {
    case TableTenancyStrategy.SHARED_REFERENCE:
      return TABLE_WIDE_ONLY_SCOPE;
    case TableTenancyStrategy.ORGANIZATION_IDENTITY:
      return bucket_scope(read_reference(record, LOCAL_ID_FIELD));
    case TableTenancyStrategy.ORGANIZATION_FIELD:
      return resolve_organization_field_scope(record);
    case TableTenancyStrategy.PARENT_SCOPED:
      return resolve_parent_scoped_scope(ctx, table_name, record);
  }
}
