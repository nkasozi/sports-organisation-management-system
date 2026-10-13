import { get } from "svelte/store";

import { goto } from "$app/navigation";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";
import { auth_store } from "$lib/presentation/stores/auth";

import type { ProfileManagementAccessDependencies } from "./profileManagementPageControllerLogic";

export function create_profile_management_access_dependencies(): ProfileManagementAccessDependencies {
  return {
    ensure_auth_profile,
    get_auth_state: () => get(auth_store),
    check_entity_authorized: (raw_token, entity_type, action) =>
      get_authorization_adapter().check_entity_authorized(
        raw_token,
        entity_type,
        action,
      ),
    set_access_denial: (path, message) =>
      access_denial_store.set_denial(path, message),
    navigate_home: (route) => void goto(route),
  };
}
