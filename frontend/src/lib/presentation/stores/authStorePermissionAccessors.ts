import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  EntityAuthorizationMap,
  FeatureAccess,
} from "$lib/core/interfaces/ports";

import {
  compute_authorization_level,
  compute_disabled_functionalities,
  compute_feature_access,
  compute_is_authorized_to_execute,
  compute_is_functionality_disabled,
} from "./authPermissions";
import type { AuthState } from "./authTypes";

interface AuthStorePermissionAccessors {
  get_authorization_level: (entity_type: string) => EntityAuthorizationMap;
  is_authorized_to_execute: (
    action: string,
    entity_type: string,
    _entity_id?: string,
    _target_org_id?: string,
    _target_team_id?: string,
  ) => AuthorizationCheckResult;
  get_feature_access: () => FeatureAccess;
  is_functionality_disabled: (action: string, entity_type: string) => boolean;
  get_disabled_functionalities: (entity_type: string) => AuthorizableAction[];
}

export function build_auth_store_permission_accessors(
  read_state: () => AuthState,
): AuthStorePermissionAccessors {
  return {
    get_authorization_level: (entity_type: string): EntityAuthorizationMap =>
      compute_authorization_level(read_state(), entity_type),
    is_authorized_to_execute: (
      action: string,
      entity_type: string,
    ): AuthorizationCheckResult =>
      compute_is_authorized_to_execute(
        read_state(),
        action as AuthorizableAction,
        entity_type,
      ),
    get_feature_access: (): FeatureAccess =>
      compute_feature_access(read_state()),
    is_functionality_disabled: (action: string, entity_type: string): boolean =>
      compute_is_functionality_disabled(
        read_state(),
        action as AuthorizableAction,
        entity_type,
      ),
    get_disabled_functionalities: (entity_type: string): AuthorizableAction[] =>
      compute_disabled_functionalities(read_state(), entity_type),
  };
}
