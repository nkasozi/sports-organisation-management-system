import type { ConvexClient } from "convex/browser";
import type {
  AuthorizationPort,
  ProfilePermissions,
  AuthorizationFailure,
  SidebarMenuGroup,
  RouteAccessGranted,
  RouteAccessDenied,
  DataAction,
  EntityAuthorizationResult,
  CategoryPermissions,
  DataCategory,
} from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import type { UserRole } from "$lib/core/interfaces/ports/external/iam/AuthenticationPort";
import type { AsyncResult } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import {
  create_auth_cache,
  type AuthCache,
} from "$lib/infrastructure/cache/AuthCache";

interface ConvexQueryClient {
  query(name: string, args?: Record<string, unknown>): Promise<unknown>;
}

const CONVEX_AUTH_CACHE_MAX_ENTRIES = 100;
const CONVEX_AUTH_CACHE_TTL_MS = 60 * 60 * 1000;

export class ConvexAuthorizationAdapter implements AuthorizationPort {
  private convex_client: ConvexQueryClient;
  private authorization_cache: AuthCache<unknown>;

  constructor(
    convex_client: ConvexQueryClient,
    authorization_cache?: AuthCache<unknown>,
  ) {
    this.convex_client = convex_client;
    this.authorization_cache =
      authorization_cache ??
      create_auth_cache<unknown>({
        max_entries: CONVEX_AUTH_CACHE_MAX_ENTRIES,
        fallback_ttl_ms: CONVEX_AUTH_CACHE_TTL_MS,
      });
  }

  get_authorization_cache(): AuthCache<unknown> {
    return this.authorization_cache;
  }

  async get_profile_permissions(
    _raw_token: string,
  ): AsyncResult<ProfilePermissions, AuthorizationFailure> {
    const cache_key = "profile_permissions";
    const cached = this.authorization_cache.get_or_miss(cache_key);

    if (cached.is_hit && cached.value) {
      console.log(
        "[ConvexAuthorizationAdapter] Cache HIT for profile permissions",
      );
      return cached.value as Awaited<
        AsyncResult<ProfilePermissions, AuthorizationFailure>
      >;
    }

    try {
      const user_profile = (await this.convex_client.query(
        "authorization:get_current_user_profile",
        {},
      )) as { role: string } | null;

      if (!user_profile) {
        return create_failure_result({
          failure_type: "token_invalid",
          message: "No user profile found",
        });
      }

      const role = user_profile.role as UserRole;
      const categories: DataCategory[] = [
        "root_level",
        "org_administrator_level",
        "organisation_level",
        "team_level",
        "player_level",
      ];

      const permissions: Record<DataCategory, CategoryPermissions> =
        {} as Record<DataCategory, CategoryPermissions>;

      for (const category of categories) {
        const auth_result = (await this.convex_client.query(
          "authorization:check_entity_authorized",
          { entity_type: category, action: "read" },
        )) as { is_authorized: boolean };

        permissions[category] = {
          create: false,
          read: auth_result.is_authorized,
          update: false,
          delete: false,
        };

        for (const action of ["create", "update", "delete"] as DataAction[]) {
          const action_result = (await this.convex_client.query(
            "authorization:check_entity_authorized",
            { entity_type: category, action },
          )) as { is_authorized: boolean };
          switch (action) {
            case "create":
              permissions[category].create = action_result.is_authorized;
              break;
            case "update":
              permissions[category].update = action_result.is_authorized;
              break;
            case "delete":
              permissions[category].delete = action_result.is_authorized;
              break;
          }
        }
      }

      const profile_permissions: ProfilePermissions = { role, permissions };
      const result = create_success_result(profile_permissions);
      this.authorization_cache.set(cache_key, result);
      return result;
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error fetching permissions:",
        error,
      );
      return create_failure_result({
        failure_type: "token_invalid",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch permissions",
      });
    }
  }

  async get_sidebar_menu_for_profile(
    _raw_token: string,
  ): AsyncResult<SidebarMenuGroup[], AuthorizationFailure> {
    const cache_key = "sidebar_menu";
    const cached = this.authorization_cache.get_or_miss(cache_key);

    if (cached.is_hit && cached.value) {
      console.log("[ConvexAuthorizationAdapter] Cache HIT for sidebar menu");
      return cached.value as Awaited<
        AsyncResult<SidebarMenuGroup[], AuthorizationFailure>
      >;
    }

    try {
      const menu_groups = (await this.convex_client.query(
        "authorization:get_sidebar_menu",
        {},
      )) as Array<{
        group_name: string;
        items: Array<{ name: string; href: string; icon: string }>;
      }>;

      if (!menu_groups || menu_groups.length === 0) {
        return create_failure_result({
          failure_type: "token_invalid",
          message: "No menu items found for user",
        });
      }

      const menu_result: SidebarMenuGroup[] = menu_groups.map((group) => ({
        group_name: group.group_name,
        items: group.items.map((item) => ({
          name: item.name,
          href: item.href,
          icon: item.icon,
        })),
      }));

      const result = create_success_result(menu_result);
      this.authorization_cache.set(cache_key, result);
      return result;
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error fetching sidebar menu:",
        error,
      );
      return create_failure_result({
        failure_type: "token_invalid",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch sidebar menu",
      });
    }
  }

  async can_profile_access_route(
    _raw_token: string,
    route: string,
  ): AsyncResult<RouteAccessGranted, RouteAccessDenied> {
    const cache_key = `route_access:${route}`;
    const cached = this.authorization_cache.get_or_miss(cache_key);

    if (cached.is_hit && cached.value) {
      return cached.value as Awaited<
        AsyncResult<RouteAccessGranted, RouteAccessDenied>
      >;
    }

    try {
      const access_result = (await this.convex_client.query(
        "authorization:can_access_route",
        { route },
      )) as { can_access: boolean; reason?: string };

      if (!access_result.can_access) {
        return create_failure_result({
          route,
          message: access_result.reason || "Access denied",
        });
      }

      const menu_result = await this.get_sidebar_menu_for_profile("");
      const all_routes = menu_result.success ? menu_result.data : [];

      const result = create_success_result({
        route,
        all_accessible_routes: all_routes,
      });
      this.authorization_cache.set(cache_key, result);
      return result;
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error checking route access:",
        error,
      );
      return create_failure_result({
        route,
        message:
          error instanceof Error
            ? error.message
            : "Failed to check route access",
      });
    }
  }

  async check_entity_authorized(
    _raw_token: string,
    entity_type: string,
    action: DataAction,
  ): AsyncResult<EntityAuthorizationResult> {
    const cache_key = `entity_auth:${entity_type}:${action}`;
    const cached = this.authorization_cache.get_or_miss(cache_key);

    if (cached.is_hit && cached.value) {
      return create_success_result(cached.value as EntityAuthorizationResult);
    }

    try {
      const query_result = (await this.convex_client.query(
        "authorization:check_entity_authorized",
        { entity_type, action },
      )) as {
        is_authorized: boolean;
        data_category?: string;
        user_role?: string;
        reason?: string;
      };

      const auth_result: EntityAuthorizationResult = {
        is_authorized: query_result.is_authorized,
        failure_reason: query_result.is_authorized
          ? undefined
          : "permission_denied",
        data_category: query_result.data_category as DataCategory,
        role: query_result.user_role as UserRole,
        reason: query_result.reason,
      };

      this.authorization_cache.set(cache_key, auth_result);
      return create_success_result(auth_result);
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error checking entity authorization:",
        error,
      );
      return create_success_result({
        is_authorized: false,
        failure_reason: "token_invalid",
        reason:
          error instanceof Error
            ? error.message
            : "Failed to check authorization",
      });
    }
  }

  async get_allowed_entity_actions(
    _raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]> {
    const cache_key = `allowed_actions:${entity_type}`;
    const cached = this.authorization_cache.get_or_miss(cache_key);

    if (cached.is_hit && cached.value) {
      return create_success_result(cached.value as DataAction[]);
    }

    try {
      const actions = (await this.convex_client.query(
        "authorization:get_allowed_entity_actions",
        { entity_type },
      )) as DataAction[];

      this.authorization_cache.set(cache_key, actions);
      return create_success_result(actions);
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error fetching allowed actions:",
        error,
      );
      return create_success_result([]);
    }
  }

  async get_disabled_entity_actions(
    _raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]> {
    const cache_key = `disabled_actions:${entity_type}`;
    const cached = this.authorization_cache.get_or_miss(cache_key);

    if (cached.is_hit && cached.value) {
      return create_success_result(cached.value as DataAction[]);
    }

    try {
      const actions = (await this.convex_client.query(
        "authorization:get_disabled_entity_actions",
        { entity_type },
      )) as DataAction[];

      this.authorization_cache.set(cache_key, actions);
      return create_success_result(actions);
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error fetching disabled actions:",
        error,
      );
      return create_success_result([
        "create",
        "read",
        "update",
        "delete",
      ] as DataAction[]);
    }
  }

  clear_cache(): number {
    return this.authorization_cache.invalidate_all();
  }
}
