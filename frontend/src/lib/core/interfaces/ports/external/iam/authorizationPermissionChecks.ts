import type {
  SharedCrudPermissions,
  SharedEntityType,
} from "$convex/shared_permission_definitions";
import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
} from "$convex/shared_permission_definitions";

import type { UserRole } from "./AuthenticationPort";
import type {
  CategoryPermissions,
  DataAction,
  DataCategory,
  RolePermissionMap,
} from "./AuthorizationPort";

const UNKNOWN_ROLE_DENIED_EVENT = "authorization_unknown_role_denied";
const UNKNOWN_ENTITY_DENIED_EVENT = "authorization_unknown_entity_denied";
const UNKNOWN_ROLE_DENIED_MESSAGE =
  "[AuthorizationPermissionChecks] Unknown role denied all permissions";
const UNKNOWN_ENTITY_DENIED_MESSAGE =
  "[AuthorizationPermissionChecks] Unknown entity type denied";
const DENIED_CATEGORY_PERMISSIONS: CategoryPermissions = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

const ENTITY_LEVEL_DISABLED_OPERATIONS: Partial<
  Record<SharedEntityType, ("create" | "edit" | "delete")[]>
> = {
  playerteamtransferhistory: ["delete"],
  playerteammembership: ["edit"],
};

export function get_entity_level_disabled_operations(
  entity_type: SharedEntityType,
): ("create" | "edit" | "delete")[] {
  return ENTITY_LEVEL_DISABLED_OPERATIONS[entity_type] ?? [];
}

export function normalize_to_entity_type(raw: string): SharedEntityType {
  return raw.toLowerCase().replace(/[\s_-]/g, "") as SharedEntityType;
}

export function get_entity_data_category(
  entity_type: SharedEntityType,
): DataCategory {
  return SHARED_ENTITY_CATEGORY_MAP[entity_type] || "organisation_level";
}

function shared_to_category_permissions(
  shared: SharedCrudPermissions,
): CategoryPermissions {
  return {
    create: shared.can_create,
    read: shared.can_read,
    update: shared.can_update,
    delete: shared.can_delete,
  };
}

function is_known_role(role: UserRole): boolean {
  return Object.prototype.hasOwnProperty.call(SHARED_ROLE_PERMISSIONS, role);
}

function is_known_entity_type(entity_type: SharedEntityType): boolean {
  return Object.prototype.hasOwnProperty.call(
    SHARED_ENTITY_CATEGORY_MAP,
    entity_type,
  );
}

function build_denied_role_permissions(): RolePermissionMap {
  return Object.fromEntries(
    Object.keys(SHARED_ROLE_PERMISSIONS.super_admin).map((category) => [
      category,
      { ...DENIED_CATEGORY_PERMISSIONS },
    ]),
  ) as RolePermissionMap;
}

export function get_role_permissions(role: UserRole): RolePermissionMap {
  if (!is_known_role(role)) {
    console.warn(UNKNOWN_ROLE_DENIED_MESSAGE, {
      event: UNKNOWN_ROLE_DENIED_EVENT,
      role,
    });
    return build_denied_role_permissions();
  }
  return Object.fromEntries(
    Object.entries(SHARED_ROLE_PERMISSIONS[role]).map(([category, perms]) => [
      category,
      shared_to_category_permissions(perms),
    ]),
  ) as RolePermissionMap;
}

export function check_data_permission(
  role: UserRole,
  category: DataCategory,
  action: DataAction,
): boolean {
  const role_permissions = get_role_permissions(role);
  const category_permissions = role_permissions[category];
  return category_permissions[action];
}

export function check_entity_permission(
  role: UserRole,
  entity_type: SharedEntityType,
  action: DataAction,
): boolean {
  if (!is_known_entity_type(entity_type)) {
    console.warn(UNKNOWN_ENTITY_DENIED_MESSAGE, {
      event: UNKNOWN_ENTITY_DENIED_EVENT,
      entity_type,
    });
    return false;
  }
  const category = get_entity_data_category(entity_type);
  return check_data_permission(role, category, action);
}
