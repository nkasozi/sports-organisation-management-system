import { v } from "convex/values";

import {
  is_parent_scoped_table,
  PARENT_REFERENCE_SPECS,
  ParentReferenceKind,
} from "./parent_reference_specs";
import { is_string } from "./value_guards";

const ORGANIZATION_SCOPE_FIELD_NAMES = [
  "local_id",
  "organization_id",
  "team_id",
];
const IDENTITY_SCOPE_FIELD_NAMES_BY_TABLE: Readonly<Record<string, string[]>> =
  { system_users: ["email"] };
const NO_IDENTITY_SCOPE_FIELD_NAMES: string[] = [];

export const ParentOrganizationSnapshotKind = {
  NOT_PARENT_SCOPED: "not_parent_scoped",
  RESOLVED: "resolved",
  UNRESOLVED: "unresolved",
} as const;

export type ParentOrganizationSnapshot =
  | { kind: typeof ParentOrganizationSnapshotKind.NOT_PARENT_SCOPED }
  | {
      kind: typeof ParentOrganizationSnapshotKind.RESOLVED;
      organization_id: string;
    }
  | { kind: typeof ParentOrganizationSnapshotKind.UNRESOLVED };

export interface StoredTombstoneScope {
  fields: Record<string, string>;
  parent_organization: ParentOrganizationSnapshot;
}

export const TombstoneVisibilityKind = {
  LEGACY: "legacy",
  DELETED: "deleted",
  SCOPE_EXIT: "scope_exit",
} as const;

export type StoredTombstoneVisibility =
  | {
      kind: typeof TombstoneVisibilityKind.DELETED;
      scope: StoredTombstoneScope;
    }
  | {
      kind: typeof TombstoneVisibilityKind.SCOPE_EXIT;
      previous_scope: StoredTombstoneScope;
      current_scope: StoredTombstoneScope;
    };

const stored_tombstone_scope_validator = v.object({
  fields: v.record(v.string(), v.string()),
  parent_organization: v.union(
    v.object({
      kind: v.literal(ParentOrganizationSnapshotKind.NOT_PARENT_SCOPED),
    }),
    v.object({
      kind: v.literal(ParentOrganizationSnapshotKind.RESOLVED),
      organization_id: v.string(),
    }),
    v.object({ kind: v.literal(ParentOrganizationSnapshotKind.UNRESOLVED) }),
  ),
});

export const stored_tombstone_visibility_validator = v.union(
  v.object({
    kind: v.literal(TombstoneVisibilityKind.DELETED),
    scope: stored_tombstone_scope_validator,
  }),
  v.object({
    kind: v.literal(TombstoneVisibilityKind.SCOPE_EXIT),
    previous_scope: stored_tombstone_scope_validator,
    current_scope: stored_tombstone_scope_validator,
  }),
);

function list_parent_reference_field_names(table_name: string): string[] {
  if (!is_parent_scoped_table(table_name)) return [];
  const spec = PARENT_REFERENCE_SPECS[table_name];
  return spec.kind === ParentReferenceKind.TYPED
    ? [spec.parent_type_field, spec.parent_id_field]
    : [spec.parent_id_field];
}

function pick_string_fields(
  record: Record<string, unknown>,
  field_names: string[],
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const field_name of field_names) {
    const field_value = record[field_name];
    if (is_string(field_value)) picked[field_name] = field_value;
  }
  return picked;
}

export function build_visibility_scope_fields(
  table_name: string,
  record: Record<string, unknown>,
): Record<string, string> {
  return pick_string_fields(record, [
    ...ORGANIZATION_SCOPE_FIELD_NAMES,
    ...(IDENTITY_SCOPE_FIELD_NAMES_BY_TABLE[table_name] ??
      NO_IDENTITY_SCOPE_FIELD_NAMES),
  ]);
}

export function build_legacy_scope_fields(
  table_name: string,
  record: Record<string, unknown>,
): Record<string, string> {
  return {
    ...build_visibility_scope_fields(table_name, record),
    ...pick_string_fields(
      record,
      list_parent_reference_field_names(table_name),
    ),
  };
}

function describe_scope(scope: StoredTombstoneScope): string {
  const sorted_fields = Object.keys(scope.fields)
    .sort()
    .map((field_name) => [field_name, scope.fields[field_name]]);
  return JSON.stringify([sorted_fields, scope.parent_organization]);
}

export function tombstone_scopes_equal(
  left: StoredTombstoneScope,
  right: StoredTombstoneScope,
): boolean {
  return describe_scope(left) === describe_scope(right);
}
