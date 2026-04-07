import type {
  AuthenticationPort,
  AuthorizationFailure,
  RouteAccessDenied,
  RouteAccessGranted,
  SidebarMenuGroup,
  SystemUserRepository,
} from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";

import { get_role_for_email } from "./authProfilePermissions";
import {
  can_role_access_route,
  get_sidebar_menu_for_role,
} from "./roleMenuRegistry";

export async function get_sidebar_menu_for_profile_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
): Promise<Result<SidebarMenuGroup[], AuthorizationFailure>> {
  const cache_key = `sidebar_menu:${raw_token}`;
  const cached = authorization_cache.get_or_miss(cache_key);
  if (cached.is_hit && cached.value) {
    console.log("[LocalAuthorizationAdapter] Cache HIT for sidebar menu");
    return cached.value as Result<SidebarMenuGroup[], AuthorizationFailure>;
  }

  const verification_result = await auth_port.verify_token(raw_token);

  if (!verification_result.success) {
    console.warn(
      "[LocalAuthorizationAdapter] Token verification failed for sidebar menu",
    );
    return create_failure_result({
      failure_type: "token_invalid",
      message: verification_result.error,
    });
  }

  const verification = verification_result.data;

  if (!verification.is_valid || !verification.payload) {
    const is_expired = verification.error_message?.includes("expired");
    console.warn("[LocalAuthorizationAdapter] Invalid token for sidebar menu");
    return create_failure_result({
      failure_type: is_expired ? "token_expired" : "token_invalid",
      message: verification.error_message || "Token verification failed",
    });
  }

  const role_result = await get_role_for_email(
    system_user_repository,
    verification.payload.email,
  );
  if (!role_result.success) {
    return create_failure_result({
      failure_type: "token_invalid",
      message: role_result.error,
    });
  }

  const role = role_result.data;
  const menu_items = get_sidebar_menu_for_role(role);

  console.log(
    `[LocalAuthorizationAdapter] Getting sidebar menu for role: ${role}, returned ${menu_items.length} groups`,
  );

  const result = create_success_result(menu_items);
  authorization_cache.set(cache_key, result);
  return result;
}

export async function can_profile_access_route_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
  route: string,
): Promise<Result<RouteAccessGranted, RouteAccessDenied>> {
  const cache_key = `route_access:${raw_token}:${route}`;
  const cached = authorization_cache.get_or_miss(cache_key);
  if (cached.is_hit && cached.value) {
    return cached.value as Result<RouteAccessGranted, RouteAccessDenied>;
  }

  const verification_result = await auth_port.verify_token(raw_token);

  if (!verification_result.success) {
    return create_failure_result({ route, message: verification_result.error });
  }

  const verification = verification_result.data;

  if (!verification.is_valid || !verification.payload) {
    return create_failure_result({
      route,
      message: "Invalid or expired authentication token",
    });
  }

  const role_result = await get_role_for_email(
    system_user_repository,
    verification.payload.email,
  );
  if (!role_result.success) {
    return create_failure_result({ route, message: role_result.error });
  }

  const role = role_result.data;
  const access_check = can_role_access_route(role, route);

  if (!access_check.allowed) {
    return create_failure_result({ route, message: access_check.reason });
  }

  const all_accessible_routes = get_sidebar_menu_for_role(role);
  const result = create_success_result({ route, all_accessible_routes });
  authorization_cache.set(cache_key, result);
  return result;
}
