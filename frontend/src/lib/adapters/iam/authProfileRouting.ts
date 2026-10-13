import type {
  AuthenticationPort,
  AuthorizationFailure,
  RouteAccessDenied,
  RouteAccessGranted,
  SidebarMenuGroup,
  SystemUserRepository,
} from "$lib/core/interfaces/ports";
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
import { map_unresolved_role_to_authorization_failure } from "./authProfilePermissions";
import {
  resolve_token_role,
  TOKEN_ROLE_STATUS,
  type TokenRoleResolution,
} from "./authTokenRoleResolution";
import {
  AUTHORIZATION_CACHE_KEY_PREFIX,
  IAM_LOG_EVENT,
  IAM_MESSAGE,
} from "./iamConstants";
import {
  can_role_access_route,
  get_sidebar_menu_for_role,
} from "./roleMenuRegistry";

type SidebarMenuResult = Result<SidebarMenuGroup[], AuthorizationFailure>;
type RouteAccessResult = Result<RouteAccessGranted, RouteAccessDenied>;

export async function get_sidebar_menu_for_profile_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
): Promise<SidebarMenuResult> {
  const prefix = AUTHORIZATION_CACHE_KEY_PREFIX.SIDEBAR_MENU;
  const cache_key = build_authorization_cache_key(prefix, [raw_token]);
  const cached = read_authorization_cache<SidebarMenuResult>(
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
  const menu_items = get_sidebar_menu_for_role(resolution.role);
  console.log("[LocalAuthorizationAdapter] Resolved sidebar menu", {
    event: IAM_LOG_EVENT.SIDEBAR_MENU_RESOLVED,
    role: resolution.role,
    group_count: menu_items.length,
  });
  const result = create_success_result(menu_items);
  authorization_cache.set(cache_key, result);
  return result;
}

function describe_route_resolution_failure(
  resolution: Exclude<
    TokenRoleResolution,
    { status: typeof TOKEN_ROLE_STATUS.RESOLVED }
  >,
): string {
  switch (resolution.status) {
    case TOKEN_ROLE_STATUS.TOKEN_INVALID:
    case TOKEN_ROLE_STATUS.TOKEN_EXPIRED:
      return IAM_MESSAGE.INVALID_OR_EXPIRED_TOKEN;
    case TOKEN_ROLE_STATUS.USER_REJECTED:
    case TOKEN_ROLE_STATUS.LOOKUP_FAILED:
      return resolution.message;
  }
}

export async function can_profile_access_route_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  route: string,
): Promise<RouteAccessResult> {
  const prefix = AUTHORIZATION_CACHE_KEY_PREFIX.ROUTE_ACCESS;
  const cache_key = build_authorization_cache_key(prefix, [raw_token, route]);
  const cached = read_authorization_cache<RouteAccessResult>(
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
    return create_failure_result({
      route,
      message: describe_route_resolution_failure(resolution),
    });
  const access_check = can_role_access_route(resolution.role, route);
  if (!access_check.allowed)
    return create_failure_result({ route, message: access_check.reason });
  const all_accessible_routes = get_sidebar_menu_for_role(resolution.role);
  const result = create_success_result({ route, all_accessible_routes });
  authorization_cache.set(cache_key, result);
  return result;
}
