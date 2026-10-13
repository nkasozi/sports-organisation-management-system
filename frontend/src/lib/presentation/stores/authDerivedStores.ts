import { derived } from "svelte/store";

import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  DataCategory,
  EntityAuthorizationMap,
} from "$lib/core/interfaces/ports";
import {
  check_data_permission,
  USER_ROLE_DISPLAY_NAMES,
} from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { DATA_ACTION } from "./authPermissionConstants";
import { auth_store } from "./authStoreCore";

const AUTH_DERIVED_DISPLAY_TEXT = {
  UNKNOWN_ROLE: "Unknown",
  GUEST_NAME: "Guest",
  UNKNOWN_INITIALS: "?",
  EMPTY: "",
  NAME_SEPARATOR: " ",
} as const;

const PUBLIC_DATA_CATEGORY: DataCategory = "public_level";

export const current_user_role = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  return profile_state.status === PRESENCE_STATUS.PRESENT
    ? profile_state.profile.role
    : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
});

export const current_user_role_display = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  const role =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.role
      : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
  return role
    ? USER_ROLE_DISPLAY_NAMES[role]
    : AUTH_DERIVED_DISPLAY_TEXT.UNKNOWN_ROLE;
});

export const current_profile_organization_name = derived(
  auth_store,
  ($auth) => {
    const profile_state = $auth.current_profile;
    return profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.organization_name
      : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
  },
);

export const current_profile_display_name = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  return profile_state.status === PRESENCE_STATUS.PRESENT
    ? profile_state.profile.display_name
    : AUTH_DERIVED_DISPLAY_TEXT.GUEST_NAME;
});

export const current_profile_email = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  return profile_state.status === PRESENCE_STATUS.PRESENT
    ? profile_state.profile.email
    : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
});

export const current_profile_team_id = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  return profile_state.status === PRESENCE_STATUS.PRESENT
    ? profile_state.profile.team_id
    : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
});

export const current_profile_initials = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  const name =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.display_name
      : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
  if (!name) return AUTH_DERIVED_DISPLAY_TEXT.UNKNOWN_INITIALS;
  const words = name
    .split(AUTH_DERIVED_DISPLAY_TEXT.NAME_SEPARATOR)
    .filter((w) => w.length > 0);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

export const other_available_profiles = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  const current_id =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.id
      : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
  return $auth.available_profiles.filter((p) => p.id !== current_id);
});

export const is_auth_initialized = derived(
  auth_store,
  ($auth) => $auth.is_initialized,
);

export const is_public_viewer = derived(auth_store, ($auth) => {
  const profile_state = $auth.current_profile;
  const role =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.role
      : AUTH_DERIVED_DISPLAY_TEXT.EMPTY;
  if (!role) return false;
  return !check_data_permission(role, PUBLIC_DATA_CATEGORY, DATA_ACTION.CREATE);
});

export const sidebar_menu_items = derived(auth_store, ($auth) => {
  return $auth.sidebar_menu_items;
});

export const can_switch_profiles = derived(
  auth_store,
  ($auth) => $auth.is_demo_session,
);

export const has_verified_account_session = derived(
  auth_store,
  ($auth) =>
    $auth.is_initialized &&
    !$auth.is_demo_session &&
    $auth.current_token.status === PRESENCE_STATUS.PRESENT,
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
