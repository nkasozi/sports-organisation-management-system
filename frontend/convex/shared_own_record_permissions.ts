import { SHARED_ENTITY_CATEGORY_MAP } from "./shared_entity_category_map";
import type { SharedEntityType } from "./shared_entity_types";
import {
  SHARED_ROLE_PERMISSIONS,
  type SharedCrudPermissions,
  type SharedUserRole,
} from "./shared_permission_definitions";

export const SharedPermissionScope = {
  ALL_RECORDS: "all_records",
  OWN_RECORDS: "own_records",
  NONE: "none",
} as const;

export type SharedPermissionScopeValue =
  (typeof SharedPermissionScope)[keyof typeof SharedPermissionScope];

export const SharedCrudAction = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
} as const;

type SharedCrudActionValue =
  (typeof SharedCrudAction)[keyof typeof SharedCrudAction];

export interface SharedRecordOwners {
  player_ids: ReadonlySet<string>;
}

interface SharedOwnRecordGrant {
  role: SharedUserRole;
  entity_type: SharedEntityType;
  permissions: SharedCrudPermissions;
}

interface SharedHolderOwnershipRule {
  entity_type: SharedEntityType;
  holder_type_field: string;
  holder_id_field: string;
  holder_type: string;
  owner_set: keyof SharedRecordOwners;
}

const OWN_RECORD_FULL_PERMISSIONS: SharedCrudPermissions = {
  can_create: true,
  can_read: true,
  can_update: true,
  can_delete: true,
};

const SHARED_OWN_RECORD_GRANTS: readonly SharedOwnRecordGrant[] = [
  {
    role: "player",
    entity_type: "identification",
    permissions: OWN_RECORD_FULL_PERMISSIONS,
  },
];

const SHARED_OWNERSHIP_RULES: readonly SharedHolderOwnershipRule[] = [
  {
    entity_type: "identification",
    holder_type_field: "holder_type",
    holder_id_field: "holder_id",
    holder_type: "player",
    owner_set: "player_ids",
  },
];

const ENTITY_TYPE_SEPARATOR_PATTERN = /[\s_-]/g;
const EMPTY_TEXT = "";
const STRING_TYPE_NAME = "string";

function normalize_entity_type(entity_type: string): string {
  return entity_type
    .toLowerCase()
    .replace(ENTITY_TYPE_SEPARATOR_PATTERN, EMPTY_TEXT);
}

function has_own_key<TKey extends string>(
  lookup: Readonly<Record<TKey, unknown>>,
  key: string,
): key is TKey {
  return Object.prototype.hasOwnProperty.call(lookup, key);
}

function is_action_permitted(
  permissions: SharedCrudPermissions,
  action: SharedCrudActionValue,
): boolean {
  switch (action) {
    case SharedCrudAction.CREATE:
      return permissions.can_create;
    case SharedCrudAction.READ:
      return permissions.can_read;
    case SharedCrudAction.UPDATE:
      return permissions.can_update;
    case SharedCrudAction.DELETE:
      return permissions.can_delete;
  }
}

function is_category_action_permitted(
  role: string,
  entity_type: string,
  action: SharedCrudActionValue,
): boolean {
  if (!has_own_key(SHARED_ROLE_PERMISSIONS, role)) return false;
  if (!has_own_key(SHARED_ENTITY_CATEGORY_MAP, entity_type)) return false;
  const category = SHARED_ENTITY_CATEGORY_MAP[entity_type];
  return is_action_permitted(SHARED_ROLE_PERMISSIONS[role][category], action);
}

function is_own_record_action_granted(
  role: string,
  entity_type: string,
  action: SharedCrudActionValue,
): boolean {
  return SHARED_OWN_RECORD_GRANTS.some(
    (grant) =>
      grant.role === role &&
      grant.entity_type === entity_type &&
      is_action_permitted(grant.permissions, action),
  );
}

export function resolve_shared_entity_permission_scope(
  role: string,
  entity_type: string,
  action: SharedCrudActionValue,
): SharedPermissionScopeValue {
  const normalized_entity_type = normalize_entity_type(entity_type);
  if (is_own_record_action_granted(role, normalized_entity_type, action))
    return SharedPermissionScope.OWN_RECORDS;
  return is_category_action_permitted(role, normalized_entity_type, action)
    ? SharedPermissionScope.ALL_RECORDS
    : SharedPermissionScope.NONE;
}

function read_trimmed_text(
  record: Readonly<Record<string, unknown>>,
  field_name: string,
): string {
  const value = record[field_name];
  return typeof value === STRING_TYPE_NAME ? String(value).trim() : EMPTY_TEXT;
}

function is_held_by_owner(
  rule: SharedHolderOwnershipRule,
  record: Readonly<Record<string, unknown>>,
  owners: SharedRecordOwners,
): boolean {
  const holder_id = read_trimmed_text(record, rule.holder_id_field);
  return (
    read_trimmed_text(record, rule.holder_type_field) === rule.holder_type &&
    holder_id.length > 0 &&
    owners[rule.owner_set].has(holder_id)
  );
}

export function is_record_owned_by_shared_owners(
  entity_type: string,
  record: Readonly<Record<string, unknown>>,
  owners: SharedRecordOwners,
): boolean {
  const normalized_entity_type = normalize_entity_type(entity_type);
  return SHARED_OWNERSHIP_RULES.some(
    (rule) =>
      rule.entity_type === normalized_entity_type &&
      is_held_by_owner(rule, record, owners),
  );
}
