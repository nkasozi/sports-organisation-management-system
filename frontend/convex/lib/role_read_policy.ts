import {
  type CallerOwnership,
  OwnershipRoleKind,
  type OwnershipRoleKindValue,
} from "./caller_ownership";
import { project_public_records } from "./public_record_projection";
import { is_record_owned_by_caller } from "./record_ownership";
import type { AllowedSyncTable } from "./sync_table_catalog";

export const RoleReadPolicyKind = {
  ALL_RECORDS: "all_records",
  OWNED_RECORDS_ONLY: "owned_records_only",
  PROJECT_UNOWNED_RECORDS: "project_unowned_records",
} as const;

type OwnedOnlyTable = "identifications" | "qualifications" | "calendar_tokens";
type ProjectedTable = "players" | "officials" | "team_staff";

type RoleReadPolicy =
  | { kind: typeof RoleReadPolicyKind.ALL_RECORDS }
  | {
      kind: typeof RoleReadPolicyKind.OWNED_RECORDS_ONLY;
      table_name: OwnedOnlyTable;
    }
  | {
      kind: typeof RoleReadPolicyKind.PROJECT_UNOWNED_RECORDS;
      table_name: ProjectedTable;
    };

const ADMINISTRATORS: readonly OwnershipRoleKindValue[] = [
  OwnershipRoleKind.ADMINISTRATOR,
];
const OFFICIAL_ADMINISTRATORS: readonly OwnershipRoleKindValue[] = [
  OwnershipRoleKind.ADMINISTRATOR,
  OwnershipRoleKind.OFFICIALS_MANAGER,
];

const OWNED_ONLY_PRIVILEGED_ROLES: Readonly<
  Record<OwnedOnlyTable, readonly OwnershipRoleKindValue[]>
> = {
  identifications: OFFICIAL_ADMINISTRATORS,
  qualifications: OFFICIAL_ADMINISTRATORS,
  calendar_tokens: ADMINISTRATORS,
};

const PROJECTED_PRIVILEGED_ROLES: Readonly<
  Record<ProjectedTable, readonly OwnershipRoleKindValue[]>
> = {
  players: ADMINISTRATORS,
  officials: OFFICIAL_ADMINISTRATORS,
  team_staff: ADMINISTRATORS,
};

const ALL_RECORDS_POLICY: RoleReadPolicy = {
  kind: RoleReadPolicyKind.ALL_RECORDS,
};

function has_own_key<TKey extends string>(
  lookup: Readonly<Record<TKey, unknown>>,
  key: string,
): key is TKey {
  return Object.prototype.hasOwnProperty.call(lookup, key);
}

export function resolve_role_read_policy(
  role_kind: OwnershipRoleKindValue,
  table_name: AllowedSyncTable,
): RoleReadPolicy {
  if (has_own_key(OWNED_ONLY_PRIVILEGED_ROLES, table_name))
    return OWNED_ONLY_PRIVILEGED_ROLES[table_name].includes(role_kind)
      ? ALL_RECORDS_POLICY
      : { kind: RoleReadPolicyKind.OWNED_RECORDS_ONLY, table_name };
  if (has_own_key(PROJECTED_PRIVILEGED_ROLES, table_name))
    return PROJECTED_PRIVILEGED_ROLES[table_name].includes(role_kind)
      ? ALL_RECORDS_POLICY
      : { kind: RoleReadPolicyKind.PROJECT_UNOWNED_RECORDS, table_name };
  return ALL_RECORDS_POLICY;
}

function project_unowned_record(
  table_name: ProjectedTable,
  record: Record<string, unknown>,
  ownership: CallerOwnership,
): Record<string, unknown> {
  return is_record_owned_by_caller(table_name, record, ownership)
    ? record
    : project_public_records(table_name, [record])[0];
}

export function apply_role_read_policy<TRecord extends Record<string, unknown>>(
  policy: RoleReadPolicy,
  records: TRecord[],
  ownership: CallerOwnership,
): TRecord[] {
  switch (policy.kind) {
    case RoleReadPolicyKind.ALL_RECORDS:
      return records;
    case RoleReadPolicyKind.OWNED_RECORDS_ONLY:
      return records.filter((record) =>
        is_record_owned_by_caller(policy.table_name, record, ownership),
      );
    case RoleReadPolicyKind.PROJECT_UNOWNED_RECORDS:
      return records.map(
        (record) =>
          project_unowned_record(
            policy.table_name,
            record,
            ownership,
          ) as TRecord,
      );
  }
}
