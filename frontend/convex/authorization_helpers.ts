import type { ConvexResult } from "./lib/auth_middleware";
import type {
  SharedCrudPermissions,
  SharedDataCategory,
  SharedUserRole,
} from "./shared_permission_definitions";
import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
} from "./shared_permission_definitions";

export type UserRole = SharedUserRole;
export type DataCategory = SharedDataCategory;
export type DataAction = "create" | "read" | "update" | "delete";

export interface AuthorizationResult {
  is_authorized: boolean;
  user_role?: UserRole;
  data_category?: DataCategory;
  reason?: string;
}

export interface SystemUser {
  local_id?: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  status?: string;
}

export const ACCESS_DENIED_MESSAGE =
  "Access denied. Please contact your organization administrator.";
export const AUTH_DENIED_MESSAGE = "Access denied";

export function mask_email_for_logging(email: string): string {
  const at_index = email.indexOf("@");
  if (at_index <= 0) return "***";
  return `${email[0]}***${email.substring(at_index)}`;
}

export async function get_system_user_from_context(ctx: {
  db: any;
  auth: any;
}): Promise<ConvexResult<SystemUser>> {
  const request_id = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    console.warn("[authorization] Auth context missing identity", {
      event: "auth_identity_missing",
      request_id,
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }
  const email = identity.email;
  if (!email) {
    console.error("[authorization] JWT missing email claim", {
      event: "jwt_missing_email",
      request_id,
      identity_subject: identity.subject,
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }
  const system_user = await ctx.db
    .query("system_users")
    .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
    .first();
  if (!system_user) {
    console.warn("[authorization] System user not found", {
      event: "auth_user_not_found",
      request_id,
      masked_email: mask_email_for_logging(email),
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }
  if (system_user.status === "inactive") {
    console.warn("[authorization] Inactive user access attempt", {
      event: "auth_user_inactive",
      request_id,
      masked_email: mask_email_for_logging(email),
    });
    return { success: false, error: AUTH_DENIED_MESSAGE };
  }
  return {
    success: true,
    data: {
      local_id: system_user.local_id,
      email: system_user.email,
      name: system_user.name,
      first_name: system_user.first_name,
      last_name: system_user.last_name,
      role: system_user.role as UserRole,
      organization_id: system_user.organization_id,
      team_id: system_user.team_id,
      player_id: system_user.player_id,
      official_id: system_user.official_id,
      status: system_user.status,
    },
  };
}

export function get_entity_data_category(entity_type: string): DataCategory {
  const normalized = entity_type.toLowerCase().replace(/[\s_-]/g, "");
  return (
    (SHARED_ENTITY_CATEGORY_MAP as Record<string, DataCategory>)[normalized] ||
    "organisation_level"
  );
}

export function check_role_permission(
  role: UserRole,
  data_category: DataCategory,
  action: DataAction,
): boolean {
  const category_permissions = SHARED_ROLE_PERMISSIONS[role]?.[data_category];
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

export function get_actions_from_permissions(
  permissions: SharedCrudPermissions,
): DataAction[] {
  const actions: DataAction[] = [];
  if (permissions.can_create) actions.push("create");
  if (permissions.can_read) actions.push("read");
  if (permissions.can_update) actions.push("update");
  if (permissions.can_delete) actions.push("delete");
  return actions;
}
