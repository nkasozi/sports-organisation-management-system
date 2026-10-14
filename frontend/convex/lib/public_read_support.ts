import type { QueryCtx } from "../_generated/server";
import {
  CallerScopeKind,
  filter_global_table_records,
  read_organization_id,
} from "./caller_scope";
import { query_table_dynamically, type StoredRow } from "./dynamic_table_query";
import { type Option, OptionStatus } from "./option";
import { is_parent_scoped_table } from "./parent_reference_specs";
import { project_public_records } from "./public_record_projection";
import { filter_parent_scoped_records_for_organization } from "./scoped_record_reader";
import { load_organization_rows, LOCAL_ID_INDEX } from "./scoped_row_loader";
import {
  type AllowedSyncTable,
  is_global_table,
  is_public_table,
} from "./sync_table_catalog";
import { read_string_or } from "./value_guards";

const MAX_UNSCOPED_PUBLIC_SNAPSHOT_ROWS = 500;
const UNSCOPED_PUBLIC_SNAPSHOT_EVENT = "public_snapshot_without_organization";
const LOCAL_ID_FIELD_NAME = "local_id";
const FIRST_LOCAL_ID = "";
const NO_SCOPE = { kind: CallerScopeKind.NONE } as const;
export const ORGANIZATIONS_TABLE_NAME = "organizations";

type DatabaseReader = { db: QueryCtx["db"] };

function is_row_in_organization(
  table_name: AllowedSyncTable,
  row: StoredRow,
  organization_id: string,
): boolean {
  return table_name === ORGANIZATIONS_TABLE_NAME
    ? read_string_or(row[LOCAL_ID_FIELD_NAME], FIRST_LOCAL_ID) ===
        organization_id
    : read_organization_id(row) === organization_id;
}

async function select_organization_rows(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
  rows: StoredRow[],
  organization_id: string,
): Promise<StoredRow[]> {
  return is_parent_scoped_table(table_name)
    ? filter_parent_scoped_records_for_organization(ctx, {
        table_name,
        records: rows,
        organization_id,
      })
    : rows.filter((row) =>
        is_row_in_organization(table_name, row, organization_id),
      );
}

export async function select_public_rows(
  ctx: DatabaseReader,
  command: {
    table_name: AllowedSyncTable;
    organization_id: Option<string>;
    rows: StoredRow[];
  },
): Promise<StoredRow[]> {
  const { table_name, rows, organization_id } = command;
  if (!is_public_table(table_name)) return [];
  if (is_global_table(table_name))
    return project_public_records(
      table_name,
      filter_global_table_records(rows, NO_SCOPE),
    );
  if (organization_id.status === OptionStatus.NONE)
    return project_public_records(table_name, rows);
  return project_public_records(
    table_name,
    await select_organization_rows(
      ctx,
      table_name,
      rows,
      organization_id.value,
    ),
  );
}

async function load_unscoped_public_rows(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
): Promise<StoredRow[]> {
  const rows = await query_table_dynamically(ctx, table_name)
    .withIndex(LOCAL_ID_INDEX, (range) =>
      range.gt(LOCAL_ID_FIELD_NAME, FIRST_LOCAL_ID),
    )
    .take(MAX_UNSCOPED_PUBLIC_SNAPSHOT_ROWS);
  console.warn("[PublicRead] Snapshot requested without an organization", {
    event: UNSCOPED_PUBLIC_SNAPSHOT_EVENT,
    table_name,
    row_count: rows.length,
    row_limit: MAX_UNSCOPED_PUBLIC_SNAPSHOT_ROWS,
  });
  return rows;
}

async function load_public_source_rows(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
  organization_id: Option<string>,
): Promise<StoredRow[]> {
  if (is_global_table(table_name))
    return query_table_dynamically(ctx, table_name).collect();
  return organization_id.status === OptionStatus.SOME
    ? load_organization_rows(ctx, table_name, organization_id.value)
    : load_unscoped_public_rows(ctx, table_name);
}

export async function load_public_snapshot(
  ctx: DatabaseReader,
  table_name: AllowedSyncTable,
  organization_id: Option<string>,
): Promise<StoredRow[]> {
  if (!is_public_table(table_name)) return [];
  return select_public_rows(ctx, {
    table_name,
    organization_id,
    rows: await load_public_source_rows(ctx, table_name, organization_id),
  });
}
