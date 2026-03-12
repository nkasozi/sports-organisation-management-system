import type { Id } from "../_generated/dataModel";
import {
  SHARED_ROLE_PERMISSIONS,
  SHARED_ENTITY_CATEGORY_MAP,
} from "../shared_permission_definitions";
import type {
  SharedUserRole,
  SharedDataCategory,
} from "../shared_permission_definitions";

export type DataAction = "create" | "read" | "update" | "delete";
export type UserRole = SharedUserRole;
export type DataCategory = SharedDataCategory;

export interface SystemUserRecord {
  _id: Id<"system_users">;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  status?: string;
}

interface ConvexContext {
  db: {
    query(table: string): {
      withIndex(
        name: string,
        predicate?: (q: any) => any,
      ): { first(): Promise<any>; collect(): Promise<any[]> };
    };
  };
  auth: {
    getUserIdentity(): Promise<{ subject: string; email?: string } | null>;
  };
}

export type ConvexResult<TData, TError = string> =
  | { success: true; data: TData }
  | { success: false; error: TError };

export async function require_auth(
  ctx: ConvexContext,
): Promise<ConvexResult<SystemUserRecord>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return { success: false, error: "Not authenticated" };

  const email = identity.email;
  if (!email) {
    console.error(
      "[auth_middleware] JWT has no email claim — check Clerk JWT template configuration",
    );
    return {
      success: false,
      error: "No email in authentication token — check Clerk JWT template configuration",
    };
  }

  const system_user = (await ctx.db
    .query("system_users")
    .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
    .first()) as SystemUserRecord | null;

  if (!system_user) return { success: false, error: "User not found in system" };
  if (system_user.status === "inactive")
    return { success: false, error: "User account is deactivated" };

  return { success: true, data: system_user };
}

export function get_entity_data_category(entity_type: string): DataCategory {
  const normalized = entity_type.toLowerCase().replace(/[\s_-]/g, "");
  return (
    (SHARED_ENTITY_CATEGORY_MAP as Record<string, DataCategory>)[normalized] ||
    "organisation_level"
  );
}

export function check_permission(
  role: UserRole,
  data_category: DataCategory,
  action: DataAction,
): boolean {
  const role_permissions = SHARED_ROLE_PERMISSIONS[role];
  if (!role_permissions) return false;

  const category_permissions = role_permissions[data_category];
  if (!category_permissions) return false;

  switch (action) {
    case "create":
      return category_permissions.can_create;
    case "read":
      return category_permissions.can_read;
    case "update":
      return category_permissions.can_update;
    case "delete":
      return category_permissions.can_delete;
    default:
      return false;
  }
}

export async function require_permission(
  ctx: ConvexContext,
  entity_type: string,
  action: DataAction,
): Promise<ConvexResult<SystemUserRecord>> {
  const auth_result = await require_auth(ctx);
  if (!auth_result.success) return auth_result;

  const user = auth_result.data;
  const data_category = get_entity_data_category(entity_type);
  const is_authorized = check_permission(
    user.role as UserRole,
    data_category,
    action,
  );

  if (!is_authorized) {
    return {
      success: false,
      error: `Role "${user.role}" does not have "${action}" permission for "${entity_type}" (${data_category})`,
    };
  }

  return { success: true, data: user };
}

export function build_scope_filter(
  user: SystemUserRecord,
  entity_type: string,
): Record<string, string | undefined> {
  const role = user.role as UserRole;
  const normalized_entity = entity_type.toLowerCase().replace(/[\s_-]/g, "");

  if (role === "super_admin") return {};

  if (role === "org_admin" || role === "officials_manager") {
    return { organization_id: user.organization_id };
  }

  if (role === "team_manager") {
    return {
      organization_id: user.organization_id,
      team_id: user.team_id,
    };
  }

  if (role === "official") {
    if (
      normalized_entity === "official" ||
      normalized_entity === "officialprofile"
    ) {
      return { id: user.official_id };
    }
    return { organization_id: user.organization_id };
  }

  if (role === "player") {
    if (
      normalized_entity === "player" ||
      normalized_entity === "playerprofile"
    ) {
      return { id: user.player_id };
    }
    return { organization_id: user.organization_id };
  }

  return { organization_id: user.organization_id };
}

export const try_auth = require_auth;
