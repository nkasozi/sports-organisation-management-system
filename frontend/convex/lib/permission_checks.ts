import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
  type SharedCrudPermissions,
  type SharedDataCategory,
  type SharedUserRole,
} from "../shared_permission_definitions";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";

export const DataAction = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export type DataAction = (typeof DataAction)[keyof typeof DataAction];

export const ALL_DATA_ACTIONS: DataAction[] = Object.values(DataAction);

const DEFAULT_DATA_CATEGORY: SharedDataCategory = "organisation_level";
const ENTITY_TYPE_SEPARATOR_PATTERN = /[\s_-]/g;
const EMPTY_SEPARATOR = "";

function has_own_key<TKey extends string>(
  lookup: Record<TKey, unknown>,
  key: string,
): key is TKey {
  return Object.prototype.hasOwnProperty.call(lookup, key);
}

export function parse_data_action(value: string): Option<DataAction> {
  const matched_action = ALL_DATA_ACTIONS.find((action) => action === value);
  return matched_action
    ? create_some_option(matched_action)
    : create_none_option();
}

export function parse_user_role(value: string): Option<SharedUserRole> {
  return has_own_key(SHARED_ROLE_PERMISSIONS, value)
    ? create_some_option(value)
    : create_none_option();
}

export function get_entity_data_category(
  entity_type: string,
): SharedDataCategory {
  const normalized_entity_type = entity_type
    .toLowerCase()
    .replace(ENTITY_TYPE_SEPARATOR_PATTERN, EMPTY_SEPARATOR);
  return has_own_key(SHARED_ENTITY_CATEGORY_MAP, normalized_entity_type)
    ? SHARED_ENTITY_CATEGORY_MAP[normalized_entity_type]
    : DEFAULT_DATA_CATEGORY;
}

function is_action_permitted(
  permissions: SharedCrudPermissions,
  action: DataAction,
): boolean {
  switch (action) {
    case DataAction.CREATE:
      return permissions.can_create;
    case DataAction.READ:
      return permissions.can_read;
    case DataAction.UPDATE:
      return permissions.can_update;
    case DataAction.DELETE:
      return permissions.can_delete;
  }
}

export function check_permission(
  role: string,
  data_category: SharedDataCategory,
  action: DataAction,
): boolean {
  const parsed_role = parse_user_role(role);
  switch (parsed_role.status) {
    case OptionStatus.NONE:
      return false;
    case OptionStatus.SOME:
      return is_action_permitted(
        SHARED_ROLE_PERMISSIONS[parsed_role.value][data_category],
        action,
      );
  }
}

export function list_permitted_actions(
  permissions: SharedCrudPermissions,
): DataAction[] {
  return ALL_DATA_ACTIONS.filter((action) =>
    is_action_permitted(permissions, action),
  );
}
