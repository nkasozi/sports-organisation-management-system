import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  AuthorizationLevel,
  CategoryPermissions,
  EntityAuthorizationMap,
} from "$lib/core/interfaces/ports";
import { normalize_to_entity_type } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import { OptionStatus } from "$lib/core/types/Option";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import {
  check_entity_permission,
  find_entity_data_category,
  get_role_permissions_sync,
  log_role_permissions_unavailable,
  map_authorizable_action_to_data_action,
} from "$lib/presentation/stores/authPermissionCore";

import {
  AUTH_PERMISSION_LOG_EVENTS,
  AUTH_PERMISSION_MESSAGES,
  AUTHORIZABLE_ACTION,
  AUTHORIZATION_LEVEL,
  build_role_action_denied_message,
} from "./authPermissionConstants";
import type { AuthState } from "./authTypes";

export { compute_disabled_functionalities } from "./authDisabledFunctionalities";
export { compute_feature_access } from "./authFeatureAccess";

const LOG_EVENTS = AUTH_PERMISSION_LOG_EVENTS;

function to_authorization_level(is_permitted: boolean): AuthorizationLevel {
  return is_permitted ? AUTHORIZATION_LEVEL.FULL : AUTHORIZATION_LEVEL.NONE;
}

function build_category_authorizations(
  category_permissions: CategoryPermissions,
): Map<AuthorizableAction, AuthorizationLevel> {
  return new Map<AuthorizableAction, AuthorizationLevel>([
    [
      AUTHORIZABLE_ACTION.VIEW,
      to_authorization_level(category_permissions.read),
    ],
    [
      AUTHORIZABLE_ACTION.LIST,
      to_authorization_level(category_permissions.read),
    ],
    [
      AUTHORIZABLE_ACTION.CREATE,
      to_authorization_level(category_permissions.create),
    ],
    [
      AUTHORIZABLE_ACTION.EDIT,
      to_authorization_level(category_permissions.update),
    ],
    [
      AUTHORIZABLE_ACTION.DELETE,
      to_authorization_level(category_permissions.delete),
    ],
  ]);
}

export function compute_authorization_level(
  state: AuthState,
  entity_type: string,
): EntityAuthorizationMap {
  const profile_state = state.current_profile;
  if (profile_state.status !== PRESENCE_STATUS.PRESENT) {
    console.warn("[AuthStore] No profile available for authorization level", {
      event: LOG_EVENTS.PROFILE_MISSING_FOR_AUTHORIZATION_LEVEL,
      entity_type,
    });
    return { entity_type, authorizations: new Map() };
  }

  const permissions_result = get_role_permissions_sync(
    profile_state.profile.role,
  );
  if (!permissions_result.success) {
    log_role_permissions_unavailable(permissions_result.error);
    return { entity_type, authorizations: new Map() };
  }
  const category_option = find_entity_data_category(
    normalize_to_entity_type(entity_type),
  );
  switch (category_option.status) {
    case OptionStatus.SOME:
      return {
        entity_type,
        authorizations: build_category_authorizations(
          permissions_result.data[category_option.value],
        ),
      };
    case OptionStatus.NONE:
      console.warn("[AuthStore] Unknown entity type has no authorizations", {
        event: LOG_EVENTS.UNKNOWN_ENTITY_DENIED,
        entity_type,
      });
      return { entity_type, authorizations: new Map() };
  }
}

function build_denied_authorization_check_result(
  error_message: string,
): AuthorizationCheckResult {
  return {
    is_authorized: false,
    authorization_level: AUTHORIZATION_LEVEL.NONE,
    error_message,
  };
}

export function compute_is_authorized_to_execute(
  state: AuthState,
  action: AuthorizableAction,
  entity_type: string,
): AuthorizationCheckResult {
  const profile_state = state.current_profile;
  if (profile_state.status !== PRESENCE_STATUS.PRESENT) {
    console.warn("[AuthStore] No profile available for authorization check", {
      event: LOG_EVENTS.PROFILE_MISSING_FOR_AUTHORIZATION_CHECK,
      entity_type,
      action,
    });
    return build_denied_authorization_check_result(
      AUTH_PERMISSION_MESSAGES.NO_PROFILE,
    );
  }

  const role = profile_state.profile.role;
  const permissions_result = get_role_permissions_sync(role);
  if (!permissions_result.success) {
    log_role_permissions_unavailable(permissions_result.error);
    return build_denied_authorization_check_result(permissions_result.error);
  }
  const is_authorized = check_entity_permission(
    role,
    normalize_to_entity_type(entity_type),
    map_authorizable_action_to_data_action(action),
    permissions_result.data,
  );

  return is_authorized
    ? { is_authorized, authorization_level: AUTHORIZATION_LEVEL.FULL }
    : build_denied_authorization_check_result(
        build_role_action_denied_message(role, action, entity_type),
      );
}

export function compute_is_functionality_disabled(
  state: AuthState,
  action: AuthorizableAction,
  entity_type: string,
): boolean {
  const profile_state = state.current_profile;
  if (profile_state.status !== PRESENCE_STATUS.PRESENT) return true;

  const permissions_result = get_role_permissions_sync(
    profile_state.profile.role,
  );
  if (!permissions_result.success) {
    log_role_permissions_unavailable(permissions_result.error);
    return true;
  }
  return !check_entity_permission(
    profile_state.profile.role,
    normalize_to_entity_type(entity_type),
    map_authorizable_action_to_data_action(action),
    permissions_result.data,
  );
}
