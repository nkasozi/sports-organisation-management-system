import {
  PARENT_REFERENCE_SPECS,
  ParentReferenceKind,
  type ParentScopedTable,
  type ParentTable,
} from "./parent_reference_specs";
import type { AllowedSyncTable } from "./sync_table_catalog";
import {
  get_table_tenancy_strategy,
  TableTenancyStrategy,
} from "./table_tenancy";

const LEAF_DEPTH = 0;
const CHILD_LEVEL_INCREMENT = 1;
const REGULAR_TABLE_TIER = 0;
const ORGANIZATION_IDENTITY_TIER = 1;

export function list_parent_tables(
  table_name: ParentScopedTable,
): readonly ParentTable[] {
  const spec = PARENT_REFERENCE_SPECS[table_name];
  switch (spec.kind) {
    case ParentReferenceKind.DIRECT:
      return [spec.parent_table];
    case ParentReferenceKind.CANDIDATES:
      return spec.candidate_parent_tables;
    case ParentReferenceKind.TYPED:
      return Object.values(spec.parent_tables_by_type);
  }
}

function list_child_tables(table_name: string): ParentScopedTable[] {
  return (Object.keys(PARENT_REFERENCE_SPECS) as ParentScopedTable[]).filter(
    (child_table) =>
      (list_parent_tables(child_table) as readonly string[]).includes(
        table_name,
      ),
  );
}

function measure_descendant_depth(table_name: string): number {
  const child_depths = list_child_tables(table_name).map(
    (child_table) =>
      measure_descendant_depth(child_table) + CHILD_LEVEL_INCREMENT,
  );
  return Math.max(LEAF_DEPTH, ...child_depths);
}

function resolve_clear_tier(table_name: AllowedSyncTable): number {
  return get_table_tenancy_strategy(table_name) ===
    TableTenancyStrategy.ORGANIZATION_IDENTITY
    ? ORGANIZATION_IDENTITY_TIER
    : REGULAR_TABLE_TIER;
}

export function order_tables_children_first(
  table_names: readonly AllowedSyncTable[],
): AllowedSyncTable[] {
  return table_names
    .map((table_name, original_position) => ({
      table_name,
      original_position,
      tier: resolve_clear_tier(table_name),
      depth: measure_descendant_depth(table_name),
    }))
    .sort(
      (left, right) =>
        left.tier - right.tier ||
        left.depth - right.depth ||
        left.original_position - right.original_position,
    )
    .map((entry) => entry.table_name);
}
