import { derived } from "svelte/store";

import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  EntityAuthorizationMap,
} from "$lib/core/interfaces/ports";
import {
  check_data_permission,
  USER_ROLE_DISPLAY_NAMES,
} from "$lib/core/interfaces/ports";

import { auth_store } from "./authStoreCore";

export const current_user_role = derived(
  auth_store,
  ($auth) => $auth.current_profile?.role || null,
);

export const current_user_role_display = derived(auth_store, ($auth) => {
  const role = $auth.current_profile?.role;
  return role ? USER_ROLE_DISPLAY_NAMES[role] : "Unknown";
});

export const current_profile_organization_name = derived(
  auth_store,
  ($auth) => {
    return $auth.current_profile?.organization_name ?? "";
  },
);

export const current_profile_display_name = derived(auth_store, ($auth) => {
  return $auth.current_profile?.display_name ?? "Guest";
});

export const current_profile_email = derived(auth_store, ($auth) => {
  return $auth.current_profile?.email ?? "";
});

export const current_profile_team_id = derived(auth_store, ($auth) => {
  return $auth.current_profile?.team_id ?? "";
});

export const current_profile_initials = derived(auth_store, ($auth) => {
  const name = $auth.current_profile?.display_name ?? "";
  if (!name) return "?";
  const words = name.split(" ").filter((w) => w.length > 0);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

export const other_available_profiles = derived(auth_store, ($auth) => {
  const current_id = $auth.current_profile?.id;
  return $auth.available_profiles.filter((p) => p.id !== current_id);
});

export const is_auth_initialized = derived(
  auth_store,
  ($auth) => $auth.is_initialized,
);

export const is_public_viewer = derived(auth_store, ($auth) => {
  const role = $auth.current_profile?.role;
  if (!role) return false;
  return !check_data_permission(role, "public_level", "create");
});

export const sidebar_menu_items = derived(auth_store, ($auth) => {
  return $auth.sidebar_menu_items;
});

export const can_switch_profiles = derived(
  auth_store,
  ($auth) => $auth.is_demo_session,
);

export function get_entity_authorization_level(
  entity_type: string,
): EntityAuthorizationMap {
  return auth_store.get_authorization_level(entity_type);
}

export function check_action_authorization(
  action: AuthorizableAction,
  entity_type: string,
  entity_id?: string,
  target_organization_id?: string,
  target_team_id?: string,
): AuthorizationCheckResult {
  return auth_store.is_authorized_to_execute(
    action,
    entity_type,
    entity_id,
    target_organization_id,
    target_team_id,
  );
}

export function get_disabled_crud_actions(
  entity_type: string,
): AuthorizableAction[] {
  return auth_store.get_disabled_functionalities(entity_type);
}
