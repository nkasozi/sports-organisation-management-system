import type {
  AuthorizableAction,
  DataAction,
} from "$lib/core/interfaces/ports";
import { normalize_to_entity_type } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import {
  check_entity_permission,
  get_role_permissions_sync,
  log_role_permissions_unavailable,
} from "$lib/presentation/stores/authPermissionCore";

import {
  ALL_AUTHORIZABLE_ACTIONS,
  AUTHORIZABLE_ACTION,
  DATA_ACTION,
} from "./authPermissionConstants";
import type { AuthState } from "./authTypes";

export function compute_disabled_functionalities(
  state: AuthState,
  entity_type: string,
): AuthorizableAction[] {
  const profile_state = state.current_profile;
  if (profile_state.status !== PRESENCE_STATUS.PRESENT)
    return [...ALL_AUTHORIZABLE_ACTIONS];

  const role = profile_state.profile.role;
  const permissions_result = get_role_permissions_sync(role);
  if (!permissions_result.success) {
    log_role_permissions_unavailable(permissions_result.error);
    return [...ALL_AUTHORIZABLE_ACTIONS];
  }
  const normalized = normalize_to_entity_type(entity_type);
  const is_permitted = (data_action: DataAction): boolean =>
    check_entity_permission(
      role,
      normalized,
      data_action,
      permissions_result.data,
    );

  return [
    ...(is_permitted(DATA_ACTION.CREATE) ? [] : [AUTHORIZABLE_ACTION.CREATE]),
    ...(is_permitted(DATA_ACTION.UPDATE) ? [] : [AUTHORIZABLE_ACTION.EDIT]),
    ...(is_permitted(DATA_ACTION.DELETE) ? [] : [AUTHORIZABLE_ACTION.DELETE]),
    ...(is_permitted(DATA_ACTION.READ)
      ? []
      : [AUTHORIZABLE_ACTION.LIST, AUTHORIZABLE_ACTION.VIEW]),
  ];
}
