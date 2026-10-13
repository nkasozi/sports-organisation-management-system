import type { SharedEntityType } from "$convex/shared_permission_definitions";
import { SHARED_ENTITY_CATEGORY_MAP } from "$convex/shared_permission_definitions";
import {
  type AuthorizableAction,
  type CategoryPermissions,
  type DataAction,
  type DataCategory,
  get_role_permissions,
  type UserRole,
} from "$lib/core/interfaces/ports";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import { create_success_result, type Result } from "$lib/core/types/Result";

import {
  AUTH_PERMISSION_LOG_EVENTS,
  AUTHORIZABLE_ACTION,
  DATA_ACTION,
} from "./authPermissionConstants";

const UNKNOWN_ENTITY_DENIED_MESSAGE = "[AuthStore] Unknown entity type denied";

export function find_entity_data_category(
  entity_type: SharedEntityType,
): Option<DataCategory> {
  return Object.prototype.hasOwnProperty.call(
    SHARED_ENTITY_CATEGORY_MAP,
    entity_type,
  )
    ? create_some_option(SHARED_ENTITY_CATEGORY_MAP[entity_type])
    : create_none_option();
}

export function check_entity_permission(
  role: UserRole,
  entity_type: SharedEntityType,
  action: DataAction,
  permissions: Record<DataCategory, CategoryPermissions>,
): boolean {
  const category_option = find_entity_data_category(entity_type);
  switch (category_option.status) {
    case OptionStatus.SOME:
      return permissions[category_option.value][action];
    case OptionStatus.NONE:
      console.warn(UNKNOWN_ENTITY_DENIED_MESSAGE, {
        event: AUTH_PERMISSION_LOG_EVENTS.UNKNOWN_ENTITY_DENIED,
        entity_type,
        role,
        action,
      });
      return false;
  }
}

export function get_role_permissions_sync(
  role: UserRole,
): Result<Record<DataCategory, CategoryPermissions>> {
  return create_success_result(get_role_permissions(role));
}

export function map_authorizable_action_to_data_action(
  action: AuthorizableAction,
): DataAction {
  switch (action) {
    case AUTHORIZABLE_ACTION.CREATE:
      return DATA_ACTION.CREATE;
    case AUTHORIZABLE_ACTION.EDIT:
      return DATA_ACTION.UPDATE;
    case AUTHORIZABLE_ACTION.DELETE:
      return DATA_ACTION.DELETE;
    case AUTHORIZABLE_ACTION.LIST:
    case AUTHORIZABLE_ACTION.VIEW:
      return DATA_ACTION.READ;
  }
}

export function log_role_permissions_unavailable(error: string): boolean {
  console.error("[AuthStore] Role permissions unavailable", {
    event: AUTH_PERMISSION_LOG_EVENTS.ROLE_PERMISSIONS_UNAVAILABLE,
    error,
  });
  return true;
}
