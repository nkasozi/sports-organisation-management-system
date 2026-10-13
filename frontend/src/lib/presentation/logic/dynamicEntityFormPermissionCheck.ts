import { get } from "svelte/store";

import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

import { auth_store } from "../stores/auth";
import { ensure_auth_profile } from "./authGuard";
import { DYNAMIC_ENTITY_FORM_EVENT } from "./dynamicEntityFormMessages";
import { normalize_dynamic_form_entity_type } from "./dynamicFormConstants";
import { PRESENCE_STATUS } from "./presenceStatus";

type DynamicEntityFormPermissionCheckResult = {
  auth_profile_missing: boolean;
  auth_error_message: string;
  permission_denied: boolean;
  permission_denied_message: string;
};

const PERMISSION_GRANTED_RESULT: DynamicEntityFormPermissionCheckResult = {
  auth_profile_missing: false,
  auth_error_message: "",
  permission_denied: false,
  permission_denied_message: "",
};

function build_permission_denied_result(
  required_action: string,
  entity_display_name: string,
): DynamicEntityFormPermissionCheckResult {
  return {
    auth_profile_missing: false,
    auth_error_message: "",
    permission_denied: true,
    permission_denied_message: `Access denied: Your role does not have permission to ${required_action} ${entity_display_name} records.`,
  };
}

export async function run_dynamic_entity_form_permission_check(
  entity_type: string,
  is_edit_mode: boolean,
  entity_display_name: string,
): Promise<DynamicEntityFormPermissionCheckResult> {
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    return {
      ...PERMISSION_GRANTED_RESULT,
      auth_profile_missing: true,
      auth_error_message: auth_result.error_message,
    };
  }

  const auth_state = get(auth_store);
  if (auth_state.current_token.status !== PRESENCE_STATUS.PRESENT) {
    return { ...PERMISSION_GRANTED_RESULT };
  }

  const required_action = is_edit_mode ? "update" : "create";
  const authorization_check =
    await get_authorization_adapter().check_entity_authorized(
      auth_state.current_token.token.raw_token,
      normalize_dynamic_form_entity_type(entity_type),
      required_action,
    );
  if (!authorization_check.success) {
    console.warn("[DynamicEntityForm] Authorization check unavailable", {
      event: DYNAMIC_ENTITY_FORM_EVENT.AUTHORIZATION_CHECK_FAILED,
      entity_type,
      required_action,
      error: authorization_check.error,
    });
  }
  return authorization_check.success && !authorization_check.data.is_authorized
    ? build_permission_denied_result(required_action, entity_display_name)
    : { ...PERMISSION_GRANTED_RESULT };
}
