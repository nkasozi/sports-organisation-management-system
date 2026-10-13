import type {
  AuthenticationPort,
  DataAction,
  EntityAuthorizationResult,
  SystemUserRepository,
  UserRole,
} from "$lib/core/interfaces/ports";
import {
  check_data_permission,
  get_entity_data_category,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";
import { OptionStatus } from "$lib/core/types/Option";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";
import { EventBus } from "$lib/infrastructure/events/EventBus";

import {
  build_authorization_cache_key,
  read_authorization_cache,
} from "./authorizationCacheAccess";
import {
  resolve_token_role,
  TOKEN_ROLE_STATUS,
  type TokenRoleResolution,
} from "./authTokenRoleResolution";
import {
  AUTHORIZATION_CACHE_KEY_PREFIX,
  AUTHORIZATION_FAILURE_TYPE,
  IAM_SCOPE,
} from "./iamConstants";

interface EntityPermissionCheck {
  role: UserRole;
  entity_type: string;
  action: DataAction;
}

function evaluate_entity_permission(
  check: EntityPermissionCheck,
): EntityAuthorizationResult {
  const category = get_entity_data_category(
    normalize_to_entity_type(check.entity_type),
  );
  const { role, action, entity_type } = check;
  if (check_data_permission(role, category, action))
    return { is_authorized: true, data_category: category, role };
  const denial_reason = `Role "${role}" does not have "${action}" permission for ${entity_type} (${category} data)`;
  EventBus.emit_access_denied(
    entity_type,
    IAM_SCOPE.ALL_ENTITIES,
    action,
    category,
    denial_reason,
    role,
  );
  return {
    is_authorized: false,
    failure_reason: AUTHORIZATION_FAILURE_TYPE.PERMISSION_DENIED,
    data_category: category,
    role,
    reason: denial_reason,
  };
}

function describe_unresolved_entity_authorization(
  resolution: Exclude<
    TokenRoleResolution,
    { status: typeof TOKEN_ROLE_STATUS.RESOLVED }
  >,
): Result<EntityAuthorizationResult> {
  switch (resolution.status) {
    case TOKEN_ROLE_STATUS.LOOKUP_FAILED:
      return create_failure_result(resolution.message);
    case TOKEN_ROLE_STATUS.TOKEN_EXPIRED:
      return create_success_result({
        is_authorized: false,
        failure_reason: AUTHORIZATION_FAILURE_TYPE.TOKEN_EXPIRED,
        reason: resolution.message,
      });
    case TOKEN_ROLE_STATUS.TOKEN_INVALID:
    case TOKEN_ROLE_STATUS.USER_REJECTED:
      return create_success_result({
        is_authorized: false,
        failure_reason: AUTHORIZATION_FAILURE_TYPE.TOKEN_INVALID,
        reason: resolution.message,
      });
  }
}

export async function check_entity_authorized_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  entity_type: string,
  action: DataAction,
): AsyncResult<EntityAuthorizationResult> {
  const prefix = AUTHORIZATION_CACHE_KEY_PREFIX.ENTITY_AUTHORIZATION;
  const key_parts = [raw_token, entity_type, action];
  const cache_key = build_authorization_cache_key(prefix, key_parts);
  const cached = read_authorization_cache<EntityAuthorizationResult>(
    authorization_cache,
    cache_key,
    prefix,
  );
  if (cached.status === OptionStatus.SOME)
    return create_success_result(cached.value);
  const resolution = await resolve_token_role({
    auth_port,
    system_user_repository,
    raw_token,
  });
  if (resolution.status !== TOKEN_ROLE_STATUS.RESOLVED)
    return describe_unresolved_entity_authorization(resolution);
  const result = evaluate_entity_permission({
    role: resolution.role,
    entity_type,
    action,
  });
  authorization_cache.set(cache_key, result);
  return create_success_result(result);
}
