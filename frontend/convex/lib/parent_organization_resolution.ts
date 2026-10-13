import {
  is_parent_scoped_table,
  PARENT_REFERENCE_SPECS,
  ParentReferenceKind,
  type ParentScopedTable,
  type ParentTable,
  read_reference,
} from "./parent_reference_specs";
import {
  classify_record_organization,
  RecordOrganizationKind,
} from "./record_organization";

const MAX_PARENT_DEPTH = 3;
const LOCAL_ID_FIELD = "local_id";

export const ParentResolutionKind = {
  RESOLVED_ORGANIZATION: "resolved_organization",
  PARENT_REFERENCE_MISSING: "parent_reference_missing",
  UNSUPPORTED_PARENT_TYPE: "unsupported_parent_type",
  PARENT_NOT_FOUND: "parent_not_found",
  PARENT_AMBIGUOUS: "parent_ambiguous",
  PARENT_SHARED: "parent_shared",
  PARENT_CHAIN_TOO_DEEP: "parent_chain_too_deep",
} as const;

export type ParentOrganizationResolution =
  | {
      kind: typeof ParentResolutionKind.RESOLVED_ORGANIZATION;
      organization_id: string;
    }
  | { kind: typeof ParentResolutionKind.PARENT_REFERENCE_MISSING }
  | { kind: typeof ParentResolutionKind.UNSUPPORTED_PARENT_TYPE }
  | { kind: typeof ParentResolutionKind.PARENT_NOT_FOUND }
  | { kind: typeof ParentResolutionKind.PARENT_AMBIGUOUS }
  | { kind: typeof ParentResolutionKind.PARENT_SHARED }
  | { kind: typeof ParentResolutionKind.PARENT_CHAIN_TOO_DEEP };

export type ParentRecordLookup = ReadonlyMap<
  string,
  ReadonlyMap<string, Record<string, unknown>>
>;

export function build_parent_record_lookup(
  rows_by_table: Readonly<Record<string, Array<Record<string, unknown>>>>,
): ParentRecordLookup {
  const lookup = new Map<string, Map<string, Record<string, unknown>>>();
  for (const [table_name, rows] of Object.entries(rows_by_table)) {
    const rows_by_local_id = new Map<string, Record<string, unknown>>();
    for (const row of rows)
      rows_by_local_id.set(read_reference(row, LOCAL_ID_FIELD), row);
    lookup.set(table_name, rows_by_local_id);
  }
  return lookup;
}

export function list_candidate_parent_tables(
  table_name: ParentScopedTable,
  record: Record<string, unknown>,
): readonly ParentTable[] {
  const spec = PARENT_REFERENCE_SPECS[table_name];
  switch (spec.kind) {
    case ParentReferenceKind.DIRECT:
      return [spec.parent_table];
    case ParentReferenceKind.CANDIDATES:
      return spec.candidate_parent_tables;
    case ParentReferenceKind.TYPED: {
      const parent_type = read_reference(record, spec.parent_type_field);
      return Object.prototype.hasOwnProperty.call(
        spec.parent_tables_by_type,
        parent_type,
      )
        ? [spec.parent_tables_by_type[parent_type]]
        : [];
    }
  }
}

function resolve_parent_row(
  parent_table: ParentTable,
  parent_row: Record<string, unknown>,
  lookup: ParentRecordLookup,
  depth: number,
): ParentOrganizationResolution {
  if (is_parent_scoped_table(parent_table))
    return depth >= MAX_PARENT_DEPTH
      ? { kind: ParentResolutionKind.PARENT_CHAIN_TOO_DEEP }
      : resolve_at_depth(parent_table, parent_row, lookup, depth + 1);
  const parent_organization = classify_record_organization(parent_row);
  switch (parent_organization.kind) {
    case RecordOrganizationKind.ORGANIZATION:
      return {
        kind: ParentResolutionKind.RESOLVED_ORGANIZATION,
        organization_id: parent_organization.organization_id,
      };
    case RecordOrganizationKind.GLOBAL:
    case RecordOrganizationKind.UNSCOPED:
      return { kind: ParentResolutionKind.PARENT_SHARED };
  }
}

function resolve_at_depth(
  table_name: ParentScopedTable,
  record: Record<string, unknown>,
  lookup: ParentRecordLookup,
  depth: number,
): ParentOrganizationResolution {
  const spec = PARENT_REFERENCE_SPECS[table_name];
  const parent_local_id = read_reference(record, spec.parent_id_field);
  if (!parent_local_id)
    return { kind: ParentResolutionKind.PARENT_REFERENCE_MISSING };
  const candidate_tables = list_candidate_parent_tables(table_name, record);
  if (candidate_tables.length === 0)
    return { kind: ParentResolutionKind.UNSUPPORTED_PARENT_TYPE };
  const found_parents = candidate_tables.flatMap((parent_table) => {
    const parent_row = lookup.get(parent_table)?.get(parent_local_id);
    return parent_row ? [{ parent_table, parent_row }] : [];
  });
  switch (found_parents.length) {
    case 0:
      return { kind: ParentResolutionKind.PARENT_NOT_FOUND };
    case 1:
      return resolve_parent_row(
        found_parents[0].parent_table,
        found_parents[0].parent_row,
        lookup,
        depth,
      );
    default:
      return { kind: ParentResolutionKind.PARENT_AMBIGUOUS };
  }
}

export function resolve_parent_organization(
  table_name: ParentScopedTable,
  record: Record<string, unknown>,
  lookup: ParentRecordLookup,
): ParentOrganizationResolution {
  return resolve_at_depth(table_name, record, lookup, 0);
}
