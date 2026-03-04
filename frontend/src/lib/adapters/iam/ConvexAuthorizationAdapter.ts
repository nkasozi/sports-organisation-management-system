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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ConvexQueryClient {
  query(name: string, args?: Record<string, unknown>): Promise<unknown>;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

export class ConvexAuthorizationAdapter implements AuthorizationPort {
  private convex_client: ConvexQueryClient;
  private permissions_cache: Map<string, CacheEntry<ProfilePermissions>> =
    new Map();
  private menu_cache: Map<string, CacheEntry<SidebarMenuGroup[]>> = new Map();
  private entity_actions_cache: Map<string, CacheEntry<DataAction[]>> =
    new Map();

  constructor(convex_client: ConvexQueryClient) {
    this.convex_client = convex_client;
  }

  private is_cache_valid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  }

  private set_cache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
  ): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  async get_profile_permissions(
    _raw_token: string,
  ): AsyncResult<ProfilePermissions, AuthorizationFailure> {
    const cache_key = "profile_permissions";
    const cached = this.permissions_cache.get(cache_key);

    if (this.is_cache_valid(cached)) {
      return create_success_result(cached!.data);
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

      const result: ProfilePermissions = { role, permissions };
      this.set_cache(this.permissions_cache, cache_key, result);

      return create_success_result(result);
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
    const cached = this.menu_cache.get(cache_key);

    if (this.is_cache_valid(cached)) {
      return create_success_result(cached!.data);
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

      const result: SidebarMenuGroup[] = menu_groups.map((group) => ({
        group_name: group.group_name,
        items: group.items.map((item) => ({
          name: item.name,
          href: item.href,
          icon: item.icon,
        })),
      }));

      this.set_cache(this.menu_cache, cache_key, result);

      return create_success_result(result);
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

      return create_success_result({
        route,
        all_accessible_routes: all_routes,
      });
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
  ): Promise<EntityAuthorizationResult> {
    try {
      const result = (await this.convex_client.query(
        "authorization:check_entity_authorized",
        { entity_type, action },
      )) as {
        is_authorized: boolean;
        data_category?: string;
        user_role?: string;
        reason?: string;
      };

      return {
        is_authorized: result.is_authorized,
        failure_reason: result.is_authorized ? undefined : "permission_denied",
        data_category: result.data_category as DataCategory,
        role: result.user_role as UserRole,
        reason: result.reason,
      };
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error checking entity authorization:",
        error,
      );
      return {
        is_authorized: false,
        failure_reason: "token_invalid",
        reason:
          error instanceof Error
            ? error.message
            : "Failed to check authorization",
      };
    }
  }

  async get_allowed_entity_actions(
    _raw_token: string,
    entity_type: string,
  ): Promise<DataAction[]> {
    const cache_key = `allowed_${entity_type}`;
    const cached = this.entity_actions_cache.get(cache_key);

    if (this.is_cache_valid(cached)) {
      return cached!.data;
    }

    try {
      const actions = (await this.convex_client.query(
        "authorization:get_allowed_entity_actions",
        { entity_type },
      )) as DataAction[];

      this.set_cache(this.entity_actions_cache, cache_key, actions);

      return actions;
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error fetching allowed actions:",
        error,
      );
      return [];
    }
  }

  async get_disabled_entity_actions(
    _raw_token: string,
    entity_type: string,
  ): Promise<DataAction[]> {
    const cache_key = `disabled_${entity_type}`;
    const cached = this.entity_actions_cache.get(cache_key);

    if (this.is_cache_valid(cached)) {
      return cached!.data;
    }

    try {
      const actions = (await this.convex_client.query(
        "authorization:get_disabled_entity_actions",
        { entity_type },
      )) as DataAction[];

      this.set_cache(this.entity_actions_cache, cache_key, actions);

      return actions;
    } catch (error) {
      console.error(
        "[ConvexAuthorizationAdapter] Error fetching disabled actions:",
        error,
      );
      return ["create", "read", "update", "delete"];
    }
  }

  clear_cache(): void {
    this.permissions_cache.clear();
    this.menu_cache.clear();
    this.entity_actions_cache.clear();
  }
}
