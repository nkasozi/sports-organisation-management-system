import type { Id } from "../_generated/dataModel";
import type {
  SharedDataCategory,
  SharedUserRole,
} from "../shared_permission_definitions";
import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
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

interface ConvexIdentityRecord {
  subject: string;
  email?: string;
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
    getUserIdentity(): Promise<unknown>;
  };
}

export type ConvexResult<TData, TError = string> =
  | { success: true; data: TData }
  | { success: false; error: TError };

export const AUTH_DENIED_MESSAGE = "Access denied";
const EMPTY_SCOPE_VALUE = "";
const GLOBAL_ORGANIZATION_ID = "*";

function is_record_value(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function is_identity_record(value: unknown): value is ConvexIdentityRecord {
  return is_record_value(value) && typeof value.subject === "string";
}

function is_system_user_record(value: unknown): value is SystemUserRecord {
  return (
    is_record_value(value) &&
    typeof value.email === "string" &&
    typeof value.role === "string" &&
    "_id" in value
  );
}

function get_scope_filter_value(value: unknown): string {
  return typeof value === "string" ? value : EMPTY_SCOPE_VALUE;
}

export async function require_auth(
  ctx: ConvexContext,
): Promise<ConvexResult<SystemUserRecord>> {
  const identity_result = await ctx.auth.getUserIdentity();
  if (!is_identity_record(identity_result)) {
    console.warn("[Auth] Authentication failed", {
      event: "auth_failed",
      reason: "no_identity",
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }

  const email = identity_result.email;
  if (!email) {
    console.warn("[Auth] Authentication failed", {
      event: "auth_failed",
      reason: "no_email_claim",
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }

  const system_user_result = await ctx.db
    .query("system_users")
    .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
    .first();

  if (!is_system_user_record(system_user_result)) {
    console.warn("[Auth] Authentication failed", {
      event: "auth_failed",
      reason: "user_not_found",
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }

  const system_user = system_user_result;

  if (system_user.status === "inactive") {
    console.warn("[Auth] Authentication failed", {
      event: "auth_failed",
      reason: "account_inactive",
      user_id: system_user._id,
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }

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
): Record<string, string> {
  const role = user.role as UserRole;
  const normalized_entity = entity_type.toLowerCase().replace(/[\s_-]/g, "");

  if (user.organization_id === GLOBAL_ORGANIZATION_ID) return {};

  if (role === "org_admin" || role === "officials_manager") {
    return { organization_id: get_scope_filter_value(user.organization_id) };
  }

  if (role === "team_manager") {
    return {
      organization_id: get_scope_filter_value(user.organization_id),
      team_id: get_scope_filter_value(user.team_id),
    };
  }

  if (role === "official") {
    if (
      normalized_entity === "official" ||
      normalized_entity === "officialprofile"
    ) {
      return { id: get_scope_filter_value(user.official_id) };
    }
    return { organization_id: get_scope_filter_value(user.organization_id) };
  }

  if (role === "player") {
    if (
      normalized_entity === "player" ||
      normalized_entity === "playerprofile"
    ) {
      return { id: get_scope_filter_value(user.player_id) };
    }
    return { organization_id: get_scope_filter_value(user.organization_id) };
  }

  return { organization_id: get_scope_filter_value(user.organization_id) };
}
