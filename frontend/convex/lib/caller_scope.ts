import { is_string } from "./value_guards";
export const GLOBAL_ORGANIZATION_ID = "*";
const UNSCOPED_ORGANIZATION_ID = "";
const ORGANIZATION_FIELD_NAME = "organization_id";

export const CallerScopeKind = {
  GLOBAL: "global",
  ORGANIZATION: "organization",
  NONE: "none",
} as const;

export type CallerScope =
  | { kind: typeof CallerScopeKind.GLOBAL }
  | { kind: typeof CallerScopeKind.ORGANIZATION; organization_id: string }
  | { kind: typeof CallerScopeKind.NONE };

export function read_organization_id(record: Record<string, unknown>): string {
  const organization_id = record[ORGANIZATION_FIELD_NAME];
  return is_string(organization_id)
    ? organization_id.trim()
    : UNSCOPED_ORGANIZATION_ID;
}

export function resolve_caller_scope(caller: {
  organization_id?: string;
}): CallerScope {
  const organization_id = read_organization_id(caller);
  switch (organization_id) {
    case GLOBAL_ORGANIZATION_ID:
      return { kind: CallerScopeKind.GLOBAL };
    case UNSCOPED_ORGANIZATION_ID:
      return { kind: CallerScopeKind.NONE };
    default:
      return { kind: CallerScopeKind.ORGANIZATION, organization_id };
  }
}

export function filter_organization_owned_records<
  TRecord extends Record<string, unknown>,
>(records: TRecord[], caller_scope: CallerScope): TRecord[] {
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return records;
    case CallerScopeKind.ORGANIZATION:
      return records.filter(
        (record) =>
          read_organization_id(record) === caller_scope.organization_id,
      );
    case CallerScopeKind.NONE:
      return [];
  }
}

function is_shared_organization_id(organization_id: string): boolean {
  return (
    organization_id === GLOBAL_ORGANIZATION_ID ||
    organization_id === UNSCOPED_ORGANIZATION_ID
  );
}

export function is_global_table_record_visible(
  record: Record<string, unknown>,
  caller_scope: CallerScope,
): boolean {
  const organization_id = read_organization_id(record);
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return true;
    case CallerScopeKind.ORGANIZATION:
      return (
        is_shared_organization_id(organization_id) ||
        organization_id === caller_scope.organization_id
      );
    case CallerScopeKind.NONE:
      return is_shared_organization_id(organization_id);
  }
}

export function filter_global_table_records<
  TRecord extends Record<string, unknown>,
>(records: TRecord[], caller_scope: CallerScope): TRecord[] {
  return records.filter((record) =>
    is_global_table_record_visible(record, caller_scope),
  );
}
