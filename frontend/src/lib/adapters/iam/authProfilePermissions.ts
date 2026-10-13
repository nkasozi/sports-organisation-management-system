import type {
  AuthenticationPort,
  AuthorizationFailure,
  CategoryPermissions,
  DataCategory,
  ProfilePermissions,
  SystemUserRepository,
  UserRole,
} from "$lib/core/interfaces/ports";
import { get_role_permissions } from "$lib/core/interfaces/ports";
import { OptionStatus } from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";

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
  ALL_DATA_CATEGORIES,
  AUTHORIZATION_CACHE_KEY_PREFIX,
  AUTHORIZATION_FAILURE_TYPE,
  IAM_LOG_EVENT,
} from "./iamConstants";

type ProfilePermissionsResult = Result<
  ProfilePermissions,
  AuthorizationFailure
>;

export function map_unresolved_role_to_authorization_failure(
  resolution: Exclude<
    TokenRoleResolution,
    { status: typeof TOKEN_ROLE_STATUS.RESOLVED }
  >,
): AuthorizationFailure {
  switch (resolution.status) {
    case TOKEN_ROLE_STATUS.TOKEN_EXPIRED:
      return {
        failure_type: AUTHORIZATION_FAILURE_TYPE.TOKEN_EXPIRED,
        message: resolution.message,
      };
    case TOKEN_ROLE_STATUS.TOKEN_INVALID:
    case TOKEN_ROLE_STATUS.USER_REJECTED:
    case TOKEN_ROLE_STATUS.LOOKUP_FAILED:
      return {
        failure_type: AUTHORIZATION_FAILURE_TYPE.TOKEN_INVALID,
        message: resolution.message,
      };
  }
}

function build_profile_permissions(role: UserRole): ProfilePermissions {
  const role_permissions = get_role_permissions(role);
  const permissions = Object.fromEntries(
    ALL_DATA_CATEGORIES.map((category: DataCategory) => [
      category,
      role_permissions[category],
    ]),
  ) as Record<DataCategory, CategoryPermissions>;
  console.log("[LocalAuthorizationAdapter] Retrieved profile permissions", {
    event: IAM_LOG_EVENT.PROFILE_PERMISSIONS_RESOLVED,
    role,
  });
  return { role, permissions };
}

export async function get_profile_permissions_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
): Promise<ProfilePermissionsResult> {
  const prefix = AUTHORIZATION_CACHE_KEY_PREFIX.PROFILE_PERMISSIONS;
  const cache_key = build_authorization_cache_key(prefix, [raw_token]);
  const cached = read_authorization_cache<ProfilePermissionsResult>(
    authorization_cache,
    cache_key,
    prefix,
  );
  if (cached.status === OptionStatus.SOME) return cached.value;
  const resolution = await resolve_token_role({
    auth_port,
    system_user_repository,
    raw_token,
  });
  if (resolution.status !== TOKEN_ROLE_STATUS.RESOLVED)
    return create_failure_result(
      map_unresolved_role_to_authorization_failure(resolution),
    );
  const result = create_success_result(
    build_profile_permissions(resolution.role),
  );
  authorization_cache.set(cache_key, result);
  return result;
}
