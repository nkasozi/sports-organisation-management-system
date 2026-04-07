import type {
  SharedCrudPermissions,
  SharedEntityType,
} from "$convex/shared_permission_definitions";
import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
} from "$convex/shared_permission_definitions";
import type {
  AuthorizableAction,
  CategoryPermissions,
  DataAction,
  DataCategory,
  UserRole,
} from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";

export function get_entity_data_category(
  entity_type: SharedEntityType,
): DataCategory {
  return SHARED_ENTITY_CATEGORY_MAP[entity_type] || "organisation_level";
}

export function check_entity_permission(
  role: UserRole,
  entity_type: SharedEntityType,
  action: DataAction,
  permissions: Record<DataCategory, CategoryPermissions>,
): boolean {
  const category = get_entity_data_category(entity_type);
  return permissions[category][action];
}

function adapt_shared_permissions(
  shared: SharedCrudPermissions,
): CategoryPermissions {
  return {
    create: shared.can_create,
    read: shared.can_read,
    update: shared.can_update,
    delete: shared.can_delete,
  };
}

export function get_role_permissions_sync(
  role: UserRole,
): Result<Record<DataCategory, CategoryPermissions>> {
  const shared_permissions = SHARED_ROLE_PERMISSIONS[role];
  if (!shared_permissions) {
    console.error(
      `[AuthStore] Unknown role: "${role}" — this should never happen`,
    );
    return { success: false, error: `Unknown role: "${role}"` };
  }
  return {
    success: true,
    data: {
      root_level: adapt_shared_permissions(shared_permissions.root_level),
      org_administrator_level: adapt_shared_permissions(
        shared_permissions.org_administrator_level,
      ),
      organisation_level: adapt_shared_permissions(
        shared_permissions.organisation_level,
      ),
      team_level: adapt_shared_permissions(shared_permissions.team_level),
      player_level: adapt_shared_permissions(shared_permissions.player_level),
      public_level: adapt_shared_permissions(shared_permissions.public_level),
    },
  };
}

export function map_authorizable_action_to_data_action(
  action: AuthorizableAction,
): DataAction | null {
  switch (action) {
    case "create":
      return "create";
    case "edit":
      return "update";
    case "delete":
      return "delete";
    case "list":
    case "view":
      return "read";
    default:
      return null;
  }
}
