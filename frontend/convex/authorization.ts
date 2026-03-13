import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  SHARED_ROLE_PERMISSIONS,
  SHARED_ENTITY_CATEGORY_MAP,
} from "./shared_permission_definitions";
import type {
  SharedUserRole,
  SharedDataCategory,
  SharedCrudPermissions,
} from "./shared_permission_definitions";
import type { ConvexResult } from "./lib/auth_middleware";

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

async function get_system_user_from_context(ctx: {
  db: any;
  auth: any;
}): Promise<ConvexResult<SystemUser>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return { success: false, error: "Not authenticated" };

  const email = identity.email;
  if (!email) {
    console.error(
      "[authorization] JWT has no email claim — check Clerk JWT template configuration",
    );
    return {
      success: false,
      error:
        "No email in authentication token — check Clerk JWT template configuration",
    };
  }

  const system_user = await ctx.db
    .query("system_users")
    .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
    .first();

  if (!system_user)
    return { success: false, error: "User not found in system" };
  if (system_user.status === "inactive")
    return { success: false, error: "User account is deactivated" };

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

function get_entity_data_category(entity_type: string): DataCategory {
  const normalized = entity_type.toLowerCase().replace(/[\s_-]/g, "");
  return (
    (SHARED_ENTITY_CATEGORY_MAP as Record<string, DataCategory>)[normalized] ||
    "organisation_level"
  );
}

function check_role_permission(
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

function get_actions_from_permissions(
  permissions: SharedCrudPermissions,
): DataAction[] {
  const actions: DataAction[] = [];
  if (permissions.can_create) actions.push("create");
  if (permissions.can_read) actions.push("read");
  if (permissions.can_update) actions.push("update");
  if (permissions.can_delete) actions.push("delete");
  return actions;
}

export const check_user_access = query({
  args: {
    email: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<ConvexResult<{ email: string; role: string }>> => {
    const system_user = await ctx.db
      .query("system_users")
      .withIndex("by_email", (q: any) =>
        q.eq("email", args.email.toLowerCase()),
      )
      .first();

    if (!system_user) {
      return {
        success: false,
        error:
          "No account found with this email address. Please contact your organization administrator.",
      };
    }

    if (system_user.status === "inactive") {
      return {
        success: false,
        error:
          "Your account has been deactivated. Please contact your organization administrator.",
      };
    }

    return {
      success: true,
      data: { email: system_user.email, role: system_user.role },
    };
  },
});

export const get_current_user_profile = query({
  args: {},
  handler: async (ctx): Promise<ConvexResult<SystemUser>> => {
    return get_system_user_from_context(ctx);
  },
});

export const check_entity_authorized = query({
  args: {
    entity_type: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args): Promise<ConvexResult<AuthorizationResult>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };

    const user = user_result.data;
    const data_category = get_entity_data_category(args.entity_type);
    const is_authorized = check_role_permission(
      user.role,
      data_category,
      args.action as DataAction,
    );

    return {
      success: true,
      data: {
        is_authorized,
        user_role: user.role,
        data_category,
        reason: is_authorized
          ? undefined
          : `Role "${user.role}" does not have "${args.action}" permission for "${data_category}" data`,
      },
    };
  },
});

export const get_allowed_entity_actions = query({
  args: {
    entity_type: v.string(),
  },
  handler: async (ctx, args): Promise<ConvexResult<DataAction[]>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };

    const user = user_result.data;
    const data_category = get_entity_data_category(args.entity_type);
    const category_permissions =
      SHARED_ROLE_PERMISSIONS[user.role]?.[data_category];
    if (!category_permissions) return { success: true, data: [] };

    return {
      success: true,
      data: get_actions_from_permissions(category_permissions),
    };
  },
});

export const get_disabled_entity_actions = query({
  args: {
    entity_type: v.string(),
  },
  handler: async (ctx, args): Promise<ConvexResult<DataAction[]>> => {
    const all_actions: DataAction[] = ["create", "read", "update", "delete"];
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };

    const user = user_result.data;
    const data_category = get_entity_data_category(args.entity_type);
    const disabled = all_actions.filter(
      (action) => !check_role_permission(user.role, data_category, action),
    );
    return { success: true, data: disabled };
  },
});

export const get_sidebar_menu = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<ConvexResult<Array<{ group_name: string; items: any[] }>>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };

    const user = user_result.data;
    const menu_items = await ctx.db
      .query("sidebar_menu_items")
      .withIndex("by_role", (q: any) => q.eq("role", user.role))
      .collect();

    const groups_map = new Map<
      string,
      { group_name: string; group_order: number; items: any[] }
    >();

    for (const item of menu_items) {
      if (!groups_map.has(item.group_name)) {
        groups_map.set(item.group_name, {
          group_name: item.group_name,
          group_order: item.group_order,
          items: [],
        });
      }
      groups_map.get(item.group_name)!.items.push({
        name: item.item_name,
        href: item.item_href,
        icon: item.item_icon,
        order: item.item_order,
      });
    }

    const sorted_groups = Array.from(groups_map.values())
      .sort((a, b) => a.group_order - b.group_order)
      .map((group) => ({
        group_name: group.group_name,
        items: group.items.sort((a: any, b: any) => a.order - b.order),
      }));

    return { success: true, data: sorted_groups };
  },
});

export const get_user_scope_filter = query({
  args: {
    entity_type: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<ConvexResult<Record<string, string | undefined>>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };

    const user = user_result.data;

    if (user.role === "super_admin") return { success: true, data: {} };

    if (user.role === "org_admin") {
      return { success: true, data: { organization_id: user.organization_id } };
    }

    if (user.role === "team_manager") {
      return {
        success: true,
        data: { organization_id: user.organization_id, team_id: user.team_id },
      };
    }

    if (user.role === "official") {
      const normalized = args.entity_type.toLowerCase().replace(/[\s_-]/g, "");
      if (normalized === "official")
        return { success: true, data: { id: user.official_id } };
      return { success: true, data: { organization_id: user.organization_id } };
    }

    if (user.role === "player") {
      const normalized = args.entity_type.toLowerCase().replace(/[\s_-]/g, "");
      if (normalized === "player" || normalized === "playerprofile") {
        return { success: true, data: { id: user.player_id } };
      }
      return { success: true, data: { organization_id: user.organization_id } };
    }

    return { success: true, data: { organization_id: user.organization_id } };
  },
});
export const update_user_role = mutation({
  args: {
    target_email: v.string(),
    role: v.string(),
    organization_id: v.optional(v.string()),
    team_id: v.optional(v.string()),
    player_id: v.optional(v.string()),
    official_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin_result = await get_system_user_from_context(ctx);
    if (!admin_result.success) {
      return { success: false, error: admin_result.error };
    }
    const admin_user = admin_result.data;
    if (admin_user.role !== "super_admin" && admin_user.role !== "org_admin") {
      return { success: false, error: "Unauthorized to update user roles" };
    }

    const target_user = await ctx.db
      .query("system_users")
      .withIndex("by_email", (q: any) =>
        q.eq("email", args.target_email.toLowerCase()),
      )
      .first();

    if (!target_user) {
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(target_user._id, {
      role: args.role,
      organization_id: args.organization_id ?? target_user.organization_id,
      team_id: args.team_id ?? target_user.team_id,
      player_id: args.player_id ?? target_user.player_id,
      official_id: args.official_id ?? target_user.official_id,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const can_access_route = query({
  args: {
    route: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<ConvexResult<{ user_role: string; can_access: boolean }>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };

    const user = user_result.data;
    const menu_items = await ctx.db
      .query("sidebar_menu_items")
      .withIndex("by_role", (q: any) => q.eq("role", user.role))
      .collect();

    const all_routes = menu_items.map((item: any) => item.item_href);
    const is_allowed = all_routes.some(
      (r: string) =>
        args.route === r ||
        args.route.startsWith(r + "/") ||
        r === "/" ||
        args.route === "/",
    );

    if (!is_allowed) {
      return {
        success: false,
        error: `Access denied to route: ${args.route}`,
      };
    }

    return { success: true, data: { user_role: user.role, can_access: true } };
  },
});

export const seed_super_admin = mutation({
  args: {
    email: v.string(),
    display_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalized_email = args.email.toLowerCase();

    const existing = await ctx.db
      .query("system_users")
      .withIndex("by_email", (q: any) => q.eq("email", normalized_email))
      .first();

    if (existing) {
      if (existing.role !== "super_admin") {
        await ctx.db.patch(existing._id, {
          role: "super_admin",
          organization_id: "*",
          updated_at: new Date().toISOString(),
        });
        return {
          success: true,
          message: "Existing user promoted to super admin",
          user_id: existing._id,
        };
      }
      return {
        success: true,
        message: "Super admin already exists",
        user_id: existing._id,
      };
    }

    const now = new Date().toISOString();
    const display_name = args.display_name || "Super Admin";
    const user_id = await ctx.db.insert("system_users", {
      local_id: `super_admin_${normalized_email}`,
      email: normalized_email,
      name: display_name,
      role: "super_admin",
      organization_id: "*",
      status: "active",
      synced_at: now,
      version: 1,
      created_at: now,
      updated_at: now,
    });

    return {
      success: true,
      message: "Super admin created successfully",
      user_id,
    };
  },
});
