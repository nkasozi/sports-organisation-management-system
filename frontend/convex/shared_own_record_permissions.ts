import { SHARED_ENTITY_CATEGORY_MAP } from "./shared_entity_category_map";
import {
  SHARED_ENTITY_ROLE_GRANTS,
  SHARED_TEAM_OWN_RECORD_GRANTS,
  type SharedEntityRoleGrant,
} from "./shared_entity_role_grants";
import {
  SHARED_ROLE_PERMISSIONS,
  type SharedCrudPermissions,
} from "./shared_permission_definitions";

export {
  is_record_owned_by_shared_owners,
  type SharedTeamRecordOwners,
} from "./shared_record_ownership";

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

type SharedOwnRecordGrant = SharedEntityRoleGrant;

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
  ...SHARED_TEAM_OWN_RECORD_GRANTS,
];

const ENTITY_TYPE_SEPARATOR_PATTERN = /[\s_-]/g;
const EMPTY_TEXT = "";

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

function is_grant_action_permitted(
  grants: readonly SharedEntityRoleGrant[],
  check: { role: string; entity_type: string; action: SharedCrudActionValue },
): boolean {
  return grants.some(
    (grant) =>
      grant.role === check.role &&
      grant.entity_type === check.entity_type &&
      is_action_permitted(grant.permissions, check.action),
  );
}

export function resolve_shared_entity_permission_scope(
  role: string,
  entity_type: string,
  action: SharedCrudActionValue,
): SharedPermissionScopeValue {
  const normalized_entity_type = normalize_entity_type(entity_type);
  if (
    is_grant_action_permitted(SHARED_OWN_RECORD_GRANTS, {
      role,
      entity_type: normalized_entity_type,
      action,
    })
  )
    return SharedPermissionScope.OWN_RECORDS;
  const is_permitted =
    is_category_action_permitted(role, normalized_entity_type, action) ||
    is_grant_action_permitted(SHARED_ENTITY_ROLE_GRANTS, {
      role,
      entity_type: normalized_entity_type,
      action,
    });
  return is_permitted
    ? SharedPermissionScope.ALL_RECORDS
    : SharedPermissionScope.NONE;
}
