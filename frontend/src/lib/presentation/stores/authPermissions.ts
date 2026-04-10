import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  AuthorizationLevel,
  EntityAuthorizationMap,
  FeatureAccess,
} from "$lib/core/interfaces/ports";
import { ANY_VALUE, check_data_permission } from "$lib/core/interfaces/ports";
import { normalize_to_entity_type } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import {
  check_entity_permission,
  get_entity_data_category,
  get_role_permissions_sync,
  map_authorizable_action_to_data_action,
} from "$lib/presentation/stores/authPermissionCore";

import type { AuthState } from "./authTypes";

export function compute_authorization_level(
  state: AuthState,
  entity_type: string,
): EntityAuthorizationMap {
  if (!state.current_profile) {
    console.warn(
      "[AuthStore] No profile available for authorization level check",
    );
    return { entity_type, authorizations: new Map() };
  }

  const role = state.current_profile.role;
  const permissions_result = get_role_permissions_sync(role);
  if (!permissions_result.success) {
    console.error(`[AuthStore] ${permissions_result.error}`);
    return { entity_type, authorizations: new Map() };
  }
  const permissions = permissions_result.data;
  const authorizations = new Map<AuthorizableAction, AuthorizationLevel>();
  const normalized = normalize_to_entity_type(entity_type);
  const category = get_entity_data_category(normalized);
  const category_perms = permissions[category];

  authorizations.set("view", category_perms.read ? "full" : "none");
  authorizations.set("list", category_perms.read ? "full" : "none");
  authorizations.set("create", category_perms.create ? "full" : "none");
  authorizations.set("edit", category_perms.update ? "full" : "none");
  authorizations.set("delete", category_perms.delete ? "full" : "none");

  return { entity_type, authorizations };
}

export function compute_is_authorized_to_execute(
  state: AuthState,
  action: AuthorizableAction,
  entity_type: string,
): AuthorizationCheckResult {
  if (!state.current_profile) {
    console.warn("[AuthStore] No profile available for authorization check");
    return {
      is_authorized: false,
      authorization_level: "none",
      error_message: "No authentication profile available",
    };
  }

  const role = state.current_profile.role;
  const permissions_result = get_role_permissions_sync(role);
  if (!permissions_result.success) {
    console.error(`[AuthStore] ${permissions_result.error}`);
    return {
      is_authorized: false,
      authorization_level: "none",
      error_message: permissions_result.error,
    };
  }
  const data_action = map_authorizable_action_to_data_action(action);
  if (!data_action) return { is_authorized: true, authorization_level: "full" };

  const normalized = normalize_to_entity_type(entity_type);
  const is_authorized = check_entity_permission(
    role,
    normalized,
    data_action,
    permissions_result.data,
  );

  return {
    is_authorized,
    authorization_level: is_authorized ? "full" : "none",
    error_message: is_authorized
      ? undefined
      : `Role "${role}" does not have "${action}" permission for "${entity_type}"`,
  };
}

export function compute_feature_access(state: AuthState): FeatureAccess {
  if (!state.current_profile) {
    console.warn("[AuthStore] No profile available for feature access");
    return {
      can_reset_demo: false,
      can_view_audit_logs: false,
      can_access_dashboard: false,
      can_switch_profiles: false,
      audit_logs_scope: "none",
    };
  }

  const role = state.current_profile.role;
  const organization_id = state.current_profile.organization_id;
  const has_unrestricted_org_scope = organization_id === ANY_VALUE;
  const can_manage_org = check_data_permission(
    role,
    "org_administrator_level",
    "read",
  );

  return {
    can_reset_demo: check_data_permission(role, "root_level", "delete"),
    can_view_audit_logs: can_manage_org,
    can_access_dashboard: true,
    can_switch_profiles: state.is_demo_session,
    audit_logs_scope: has_unrestricted_org_scope
      ? "all"
      : can_manage_org
        ? "organization"
        : "none",
  };
}

export function compute_is_functionality_disabled(
  state: AuthState,
  action: AuthorizableAction,
  entity_type: string,
): boolean {
  if (!state.current_profile) return true;
  const data_action = map_authorizable_action_to_data_action(action);
  if (!data_action) return false;

  const normalized = normalize_to_entity_type(entity_type);
  const permissions_result = get_role_permissions_sync(
    state.current_profile.role,
  );
  if (!permissions_result.success) {
    console.error(`[AuthStore] ${permissions_result.error}`);
    return true;
  }
  return !check_entity_permission(
    state.current_profile.role,
    normalized,
    data_action,
    permissions_result.data,
  );
}

export function compute_disabled_functionalities(
  state: AuthState,
  entity_type: string,
): AuthorizableAction[] {
  if (!state.current_profile)
    return ["create", "edit", "delete", "list", "view"];

  const normalized = normalize_to_entity_type(entity_type);
  const permissions_result = get_role_permissions_sync(
    state.current_profile.role,
  );
  if (!permissions_result.success) {
    console.error(`[AuthStore] ${permissions_result.error}`);
    return ["create", "edit", "delete", "list", "view"];
  }
  const permissions = permissions_result.data;
  const disabled_actions: AuthorizableAction[] = [];
  const role = state.current_profile.role;

  if (!check_entity_permission(role, normalized, "create", permissions))
    disabled_actions.push("create");
  if (!check_entity_permission(role, normalized, "update", permissions))
    disabled_actions.push("edit");
  if (!check_entity_permission(role, normalized, "delete", permissions))
    disabled_actions.push("delete");
  if (!check_entity_permission(role, normalized, "read", permissions)) {
    disabled_actions.push("list");
    disabled_actions.push("view");
  }

  return disabled_actions;
}
