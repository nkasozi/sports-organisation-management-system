import type {
  AuthenticationPort,
  DataAction,
  EntityAuthorizationResult,
  SystemUserRepository,
} from "$lib/core/interfaces/ports";
import {
  check_data_permission,
  get_entity_data_category,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";
import type { AsyncResult } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";
import { EventBus } from "$lib/infrastructure/events/EventBus";

import { get_role_for_email } from "./authProfilePermissions";

function cache_entity_authorization_result(
  authorization_cache: AuthCache<unknown>,
  cache_key: string,
  result: EntityAuthorizationResult,
): EntityAuthorizationResult {
  authorization_cache.set(cache_key, result);
  return result;
}

export async function check_entity_authorized_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  entity_type: string,
  action: DataAction,
): AsyncResult<EntityAuthorizationResult> {
  const cache_key = `entity_auth:${raw_token}:${entity_type}:${action}`;
  const cached = authorization_cache.get_or_miss(cache_key);
  if (cached.is_hit && cached.value) {
    return create_success_result(cached.value as EntityAuthorizationResult);
  }

  const verification_result = await auth_port.verify_token(raw_token);

  if (!verification_result.success) {
    return create_success_result({
      is_authorized: false,
      failure_reason: "token_invalid" as const,
      reason: verification_result.error,
    });
  }

  const verification = verification_result.data;

  if (!verification.is_valid || !verification.payload) {
    const is_expired = verification.error_message?.includes("expired");
    return create_success_result({
      is_authorized: false,
      failure_reason: is_expired
        ? ("token_expired" as const)
        : ("token_invalid" as const),
      reason: verification.error_message || "Token verification failed",
    });
  }

  const role_result = await get_role_for_email(
    system_user_repository,
    verification.payload.email,
  );

  if (!role_result.success) {
    return create_success_result({
      is_authorized: false,
      failure_reason: "token_invalid" as const,
      reason: role_result.error,
    });
  }

  const role = role_result.data;
  const normalized = normalize_to_entity_type(entity_type);
  const category = get_entity_data_category(normalized);
  const is_authorized = check_data_permission(role, category, action);

  if (!is_authorized) {
    const denial_reason = `Role "${role}" does not have "${action}" permission for ${entity_type} (${category} data)`;

    EventBus.emit_access_denied(
      entity_type,
      "*",
      action,
      category,
      denial_reason,
      role,
    );

    return create_success_result(
      cache_entity_authorization_result(authorization_cache, cache_key, {
        is_authorized: false,
        failure_reason: "permission_denied",
        data_category: category,
        role,
        reason: denial_reason,
      }),
    );
  }

  return create_success_result(
    cache_entity_authorization_result(authorization_cache, cache_key, {
      is_authorized: true,
      data_category: category,
      role,
    }),
  );
}
