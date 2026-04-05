import type {
  AuthenticationPort,
  UserRole,
  SystemUserRepository,
  AuthorizationPort,
  SidebarMenuGroup,
  ProfilePermissions,
  AuthorizationFailure,
  RouteAccessGranted,
  RouteAccessDenied,
  DataAction,
  EntityAuthorizationResult,
} from "$lib/core/interfaces/ports";
import type { AsyncResult } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import {
  create_auth_cache,
  type AuthCache,
} from "$lib/infrastructure/cache/AuthCache";
import { get_profile_permissions_impl } from "./authProfilePermissions";
import {
  get_sidebar_menu_for_profile_impl,
  can_profile_access_route_impl,
} from "./authProfileRouting";
import { check_entity_authorized_impl } from "./authEntityCheck";
import {
  get_allowed_entity_actions_impl,
  get_disabled_entity_actions_impl,
} from "./authEntityActions";
import {
  get_allowed_routes_for_role,
  get_sidebar_menu_for_role,
  get_default_route_for_role,
  can_role_access_route,
  ROLE_DEFAULT_ROUTES,
} from "./roleMenuRegistry";

export {
  get_allowed_routes_for_role,
  get_sidebar_menu_for_role,
  get_default_route_for_role,
  can_role_access_route,
} from "./roleMenuRegistry";

const AUTHORIZATION_CACHE_MAX_ENTRIES = 200;
const AUTHORIZATION_CACHE_TTL_MS = 30 * 60 * 1000;

export class LocalAuthorizationAdapter implements AuthorizationPort {
  private auth_port: AuthenticationPort;
  private system_user_repository: SystemUserRepository;
  private authorization_cache: AuthCache<unknown>;

  constructor(
    auth_port: AuthenticationPort,
    system_user_repository: SystemUserRepository,
    authorization_cache?: AuthCache<unknown>,
  ) {
    this.auth_port = auth_port;
    this.system_user_repository = system_user_repository;
    this.authorization_cache =
      authorization_cache ??
      create_auth_cache<unknown>({
        max_entries: AUTHORIZATION_CACHE_MAX_ENTRIES,
        fallback_ttl_ms: AUTHORIZATION_CACHE_TTL_MS,
      });
  }

  get_authorization_cache(): AuthCache<unknown> {
    return this.authorization_cache;
  }

  async get_profile_permissions(
    raw_token: string,
  ): AsyncResult<ProfilePermissions, AuthorizationFailure> {
    return get_profile_permissions_impl(
      this.auth_port,
      this.system_user_repository,
      this.authorization_cache,
      raw_token,
    );
  }

  async get_sidebar_menu_for_profile(
    raw_token: string,
  ): AsyncResult<SidebarMenuGroup[], AuthorizationFailure> {
    return get_sidebar_menu_for_profile_impl(
      this.auth_port,
      this.system_user_repository,
      this.authorization_cache,
      raw_token,
    );
  }

  async can_profile_access_route(
    raw_token: string,
    route: string,
  ): AsyncResult<RouteAccessGranted, RouteAccessDenied> {
    return can_profile_access_route_impl(
      this.auth_port,
      this.system_user_repository,
      this.authorization_cache,
      raw_token,
      route,
    );
  }

  async check_entity_authorized(
    raw_token: string,
    entity_type: string,
    action: DataAction,
  ): AsyncResult<EntityAuthorizationResult> {
    return check_entity_authorized_impl(
      this.auth_port,
      this.system_user_repository,
      this.authorization_cache,
      raw_token,
      entity_type,
      action,
    );
  }

  async get_allowed_entity_actions(
    raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]> {
    return get_allowed_entity_actions_impl(
      this.auth_port,
      this.system_user_repository,
      this.authorization_cache,
      raw_token,
      entity_type,
    );
  }

  async get_disabled_entity_actions(
    raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]> {
    return get_disabled_entity_actions_impl(
      this.auth_port,
      this.system_user_repository,
      this.authorization_cache,
      raw_token,
      entity_type,
    );
  }

  async get_sidebar_menu_for_role(
    role: UserRole,
  ): AsyncResult<SidebarMenuGroup[]> {
    return create_success_result(get_sidebar_menu_for_role(role));
  }

  async get_accessible_routes_for_role(role: UserRole): AsyncResult<string[]> {
    return create_success_result(Array.from(get_allowed_routes_for_role(role)));
  }

  async get_default_route_for_role(role: UserRole): AsyncResult<string> {
    return create_success_result(ROLE_DEFAULT_ROUTES[role]);
  }
}
