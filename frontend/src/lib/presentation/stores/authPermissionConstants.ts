import type {
  AuthorizableAction,
  AuthorizationLevel,
  DataAction,
} from "$lib/core/interfaces/ports";

export const AUTHORIZABLE_ACTION = {
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  VIEW: "view",
  LIST: "list",
} as const satisfies Record<string, AuthorizableAction>;

export const DATA_ACTION = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
} as const satisfies Record<string, DataAction>;

export const AUTHORIZATION_LEVEL = {
  FULL: "full",
  NONE: "none",
} as const satisfies Record<string, AuthorizationLevel>;

export const ALL_AUTHORIZABLE_ACTIONS: AuthorizableAction[] = [
  AUTHORIZABLE_ACTION.CREATE,
  AUTHORIZABLE_ACTION.EDIT,
  AUTHORIZABLE_ACTION.DELETE,
  AUTHORIZABLE_ACTION.LIST,
  AUTHORIZABLE_ACTION.VIEW,
];

export const AUTH_PERMISSION_MESSAGES = {
  NO_PROFILE: "No authentication profile available",
} as const;

export const AUTH_PERMISSION_LOG_EVENTS = {
  PROFILE_MISSING_FOR_AUTHORIZATION_LEVEL:
    "auth_profile_missing_for_authorization_level",
  PROFILE_MISSING_FOR_AUTHORIZATION_CHECK:
    "auth_profile_missing_for_authorization_check",
  PROFILE_MISSING_FOR_FEATURE_ACCESS: "auth_profile_missing_for_feature_access",
  ROLE_PERMISSIONS_UNAVAILABLE: "auth_role_permissions_unavailable",
  UNKNOWN_ENTITY_DENIED: "authorization_unknown_entity_denied",
} as const;

export function build_role_action_denied_message(
  role: string,
  action: AuthorizableAction,
  entity_type: string,
): string {
  return `Role "${role}" does not have "${action}" permission for "${entity_type}"`;
}
