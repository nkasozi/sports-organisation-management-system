import type { UserRole } from "./AuthenticationPort";
import type {
  SharedEntityType,
  SharedCrudPermissions,
} from "$convex/shared_permission_definitions";
import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
} from "$convex/shared_permission_definitions";
import type {
  DataAction,
  DataCategory,
  CategoryPermissions,
  RolePermissionMap,
  DataAuthorizationResult,
} from "./AuthorizationPort";

export const ENTITY_LEVEL_DISABLED_OPERATIONS: Partial<
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

export function get_role_permissions(role: UserRole): RolePermissionMap {
  const shared =
    SHARED_ROLE_PERMISSIONS[role] ?? SHARED_ROLE_PERMISSIONS.player;
  return Object.fromEntries(
    Object.entries(shared).map(([category, perms]) => [
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
  const category = get_entity_data_category(entity_type);
  return check_data_permission(role, category, action);
}

function authorize_entity_action(
  role: UserRole,
  entity_type: SharedEntityType,
  action: DataAction,
): DataAuthorizationResult {
  const category = get_entity_data_category(entity_type);
  const is_authorized = check_data_permission(role, category, action);
  return {
    is_authorized,
    data_category: category,
    action,
    reason: is_authorized
      ? undefined
      : `Role "${role}" does not have "${action}" permission for "${category}" data`,
  };
}

function get_allowed_actions_for_entity(
  role: UserRole,
  entity_type: SharedEntityType,
): DataAction[] {
  const category = get_entity_data_category(entity_type);
  const permissions = get_role_permissions(role)[category];
  const allowed_actions: DataAction[] = [];
  if (permissions.create) allowed_actions.push("create");
  if (permissions.read) allowed_actions.push("read");
  if (permissions.update) allowed_actions.push("update");
  if (permissions.delete) allowed_actions.push("delete");
  return allowed_actions;
}

function get_disabled_crud_for_entity(
  role: UserRole,
  entity_type: SharedEntityType,
): ("create" | "read" | "update" | "delete")[] {
  const category = get_entity_data_category(entity_type);
  const permissions = get_role_permissions(role)[category];
  const disabled: ("create" | "read" | "update" | "delete")[] = [];
  if (!permissions.create) disabled.push("create");
  if (!permissions.read) disabled.push("read");
  if (!permissions.update) disabled.push("update");
  if (!permissions.delete) disabled.push("delete");
  return disabled;
}
