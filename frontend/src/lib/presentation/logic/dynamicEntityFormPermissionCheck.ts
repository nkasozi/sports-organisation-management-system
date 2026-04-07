import { get } from "svelte/store";

import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

import { auth_store } from "../stores/auth";
import { ensure_auth_profile } from "./authGuard";

export async function run_dynamic_entity_form_permission_check(
  entity_type: string,
  is_edit_mode: boolean,
  entity_display_name: string,
): Promise<{
  auth_profile_missing: boolean;
  auth_error_message: string;
  permission_denied: boolean;
  permission_denied_message: string;
}> {
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    return {
      auth_profile_missing: true,
      auth_error_message: auth_result.error_message,
      permission_denied: false,
      permission_denied_message: "",
    };
  }

  const auth_state = get(auth_store);
  if (!auth_state.current_token) {
    return {
      auth_profile_missing: false,
      auth_error_message: "",
      permission_denied: false,
      permission_denied_message: "",
    };
  }

  const required_action = is_edit_mode ? "update" : "create";
  const authorization_check =
    await get_authorization_adapter().check_entity_authorized(
      auth_state.current_token.raw_token,
      entity_type.toLowerCase().replace(/[\s_-]/g, ""),
      required_action,
    );
  return authorization_check.success && !authorization_check.data.is_authorized
    ? {
        auth_profile_missing: false,
        auth_error_message: "",
        permission_denied: true,
        permission_denied_message: `Access denied: Your role does not have permission to ${required_action} ${entity_display_name} records.`,
      }
    : {
        auth_profile_missing: false,
        auth_error_message: "",
        permission_denied: false,
        permission_denied_message: "",
      };
}
