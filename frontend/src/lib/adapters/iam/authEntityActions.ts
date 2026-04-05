import type {
  AuthenticationPort,
  SystemUserRepository,
  DataAction,
} from "$lib/core/interfaces/ports";
import {
  get_entity_data_category,
  get_role_permissions,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";
import type { AsyncResult } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";
import { get_role_for_email } from "./authProfilePermissions";

export async function get_allowed_entity_actions_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  entity_type: string,
): AsyncResult<DataAction[]> {
  const cache_key = `allowed_actions:${raw_token}:${entity_type}`;
  const cached = authorization_cache.get_or_miss(cache_key);
  if (cached.is_hit && cached.value) {
    return create_success_result(cached.value as DataAction[]);
  }

  const verification_result = await auth_port.verify_token(raw_token);

  if (
    !verification_result.success ||
    !verification_result.data.is_valid ||
    !verification_result.data.payload
  ) {
    return create_success_result([]);
  }

  const role_result = await get_role_for_email(
    system_user_repository,
    verification_result.data.payload.email,
  );
  if (!role_result.success) {
    return create_success_result([]);
  }

  const role = role_result.data;
  const normalized_allowed = normalize_to_entity_type(entity_type);
  const category = get_entity_data_category(normalized_allowed);
  const permissions = get_role_permissions(role)[category];

  const allowed_actions: DataAction[] = [];
  if (permissions.create) allowed_actions.push("create");
  if (permissions.read) allowed_actions.push("read");
  if (permissions.update) allowed_actions.push("update");
  if (permissions.delete) allowed_actions.push("delete");

  authorization_cache.set(cache_key, allowed_actions);
  return create_success_result(allowed_actions);
}

export async function get_disabled_entity_actions_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  entity_type: string,
): AsyncResult<DataAction[]> {
  const cache_key = `disabled_actions:${raw_token}:${entity_type}`;
  const cached = authorization_cache.get_or_miss(cache_key);
  if (cached.is_hit && cached.value) {
    return create_success_result(cached.value as DataAction[]);
  }

  const verification_result = await auth_port.verify_token(raw_token);

  if (
    !verification_result.success ||
    !verification_result.data.is_valid ||
    !verification_result.data.payload
  ) {
    return create_success_result([
      "create",
      "read",
      "update",
      "delete",
    ] as DataAction[]);
  }

  const role_result_disabled = await get_role_for_email(
    system_user_repository,
    verification_result.data.payload.email,
  );
  if (!role_result_disabled.success) {
    return create_success_result([
      "create",
      "read",
      "update",
      "delete",
    ] as DataAction[]);
  }

  const role = role_result_disabled.data;
  const normalized_disabled = normalize_to_entity_type(entity_type);
  const category = get_entity_data_category(normalized_disabled);
  const permissions = get_role_permissions(role)[category];

  const disabled: DataAction[] = [];
  if (!permissions.create) disabled.push("create");
  if (!permissions.read) disabled.push("read");
  if (!permissions.update) disabled.push("update");
  if (!permissions.delete) disabled.push("delete");

  authorization_cache.set(cache_key, disabled);
  return create_success_result(disabled);
}
