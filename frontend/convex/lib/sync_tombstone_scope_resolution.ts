import type { QueryCtx } from "../_generated/server";
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
  build_visibility_scope_fields,
  type ParentOrganizationSnapshot,
  ParentOrganizationSnapshotKind,
  type StoredTombstoneScope,
} from "./sync_tombstone_scope";

async function snapshot_parent_organization(
  ctx: { db: QueryCtx["db"] },
  table_name: string,
  record: Record<string, unknown>,
): Promise<ParentOrganizationSnapshot> {
  if (!is_parent_scoped_table(table_name))
    return { kind: ParentOrganizationSnapshotKind.NOT_PARENT_SCOPED };
  const lookup = await load_parent_record_lookup(
    create_database_parent_row_loader(ctx),
    table_name,
    [record],
  );
  const resolution = resolve_parent_organization(table_name, record, lookup);
  return resolution.kind === ParentResolutionKind.RESOLVED_ORGANIZATION
    ? {
        kind: ParentOrganizationSnapshotKind.RESOLVED,
        organization_id: resolution.organization_id,
      }
    : { kind: ParentOrganizationSnapshotKind.UNRESOLVED };
}

export async function resolve_tombstone_scope(
  ctx: { db: QueryCtx["db"] },
  table_name: string,
  record: Record<string, unknown>,
): Promise<StoredTombstoneScope> {
  return {
    fields: build_visibility_scope_fields(table_name, record),
    parent_organization: await snapshot_parent_organization(
      ctx,
      table_name,
      record,
    ),
  };
}
