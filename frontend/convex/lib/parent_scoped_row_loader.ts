import type { QueryCtx } from "../_generated/server";
import {
  type DynamicIndexRange,
  query_table_dynamically,
  type StoredRow,
} from "./dynamic_table_query";
import {
  PARENT_REFERENCE_SPECS,
  ParentReferenceKind,
  type ParentScopedTable,
  type ParentTable,
} from "./parent_reference_specs";
import { read_string_or } from "./value_guards";

const HOLDER_INDEX_NAME = "by_holder";
type HolderScopedTable = "identifications" | "qualifications";
const HOLDER_SCOPED_TABLES = new Set<ParentScopedTable>([
  "identifications",
  "qualifications",
]);
const LOCAL_ID_FIELD_NAME = "local_id";
const EMPTY_VALUE = "";

type OrganizationRowLoader = (table_name: ParentTable) => Promise<StoredRow[]>;

const CHILD_PARENT_INDEX_BY_TABLE: Readonly<
  Record<Exclude<ParentScopedTable, HolderScopedTable>, string>
> = {
  competition_stages: "by_competition",
  competition_teams: "by_competition",
  player_profiles: "by_player",
  team_profiles: "by_team",
  official_associated_teams: "by_official",
  profile_links: "by_profile",
};

function read_local_ids(rows: StoredRow[]): string[] {
  return rows
    .map((row) => read_string_or(row[LOCAL_ID_FIELD_NAME], EMPTY_VALUE))
    .filter((local_id) => local_id.length > 0);
}

async function load_children_by_parent_ids(
  ctx: { db: QueryCtx["db"] },
  query: { table_name: string; index_name: string },
  build_range: (
    builder: DynamicIndexRange,
    parent_id: string,
  ) => DynamicIndexRange,
  parent_ids: string[],
): Promise<StoredRow[]> {
  const child_rows: StoredRow[] = [];
  for (const parent_id of parent_ids)
    child_rows.push(
      ...(await query_table_dynamically(ctx, query.table_name)
        .withIndex(query.index_name, (builder) =>
          build_range(builder, parent_id),
        )
        .collect()),
    );
  return child_rows;
}

async function load_typed_children(
  ctx: { db: QueryCtx["db"] },
  table_name: HolderScopedTable,
  load_parent_rows: OrganizationRowLoader,
): Promise<StoredRow[]> {
  const spec = PARENT_REFERENCE_SPECS[table_name];
  if (spec.kind !== ParentReferenceKind.TYPED) return [];
  const child_rows: StoredRow[] = [];
  for (const [holder_type, parent_table] of Object.entries(
    spec.parent_tables_by_type,
  ))
    child_rows.push(
      ...(await load_children_by_parent_ids(
        ctx,
        { table_name, index_name: HOLDER_INDEX_NAME },
        (builder, parent_id) =>
          builder
            .eq(spec.parent_type_field, holder_type)
            .eq(spec.parent_id_field, parent_id),
        read_local_ids(await load_parent_rows(parent_table)),
      )),
    );
  return child_rows;
}

async function list_parent_ids(
  table_name: ParentScopedTable,
  load_parent_rows: OrganizationRowLoader,
): Promise<string[]> {
  const spec = PARENT_REFERENCE_SPECS[table_name];
  switch (spec.kind) {
    case ParentReferenceKind.DIRECT:
      return read_local_ids(await load_parent_rows(spec.parent_table));
    case ParentReferenceKind.CANDIDATES: {
      const parent_ids: string[] = [];
      for (const parent_table of spec.candidate_parent_tables)
        parent_ids.push(
          ...read_local_ids(await load_parent_rows(parent_table)),
        );
      return parent_ids;
    }
    case ParentReferenceKind.TYPED:
      return [];
  }
}

function is_holder_scoped_table(
  table_name: ParentScopedTable,
): table_name is HolderScopedTable {
  return HOLDER_SCOPED_TABLES.has(table_name);
}

export async function load_parent_scoped_rows(
  ctx: { db: QueryCtx["db"] },
  table_name: ParentScopedTable,
  load_parent_rows: OrganizationRowLoader,
): Promise<StoredRow[]> {
  if (is_holder_scoped_table(table_name))
    return load_typed_children(ctx, table_name, load_parent_rows);
  const parent_id_field = PARENT_REFERENCE_SPECS[table_name].parent_id_field;
  return load_children_by_parent_ids(
    ctx,
    { table_name, index_name: CHILD_PARENT_INDEX_BY_TABLE[table_name] },
    (builder, parent_id) => builder.eq(parent_id_field, parent_id),
    await list_parent_ids(table_name, load_parent_rows),
  );
}
