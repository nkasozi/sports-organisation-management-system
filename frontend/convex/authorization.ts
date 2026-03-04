import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player";

export type DataCategory =
  | "root_level"
  | "org_administrator_level"
  | "organisation_level"
  | "team_level"
  | "player_level";

export type DataAction = "create" | "read" | "update" | "delete";

export interface AuthorizationResult {
  is_authorized: boolean;
  user_role?: UserRole;
  data_category?: DataCategory;
  reason?: string;
}

export interface UserProfile {
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
}

async function get_user_profile_from_context(ctx: {
  db: any;
  auth: any;
}): Promise<UserProfile | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user_profile = await ctx.db
    .query("user_profiles")
    .withIndex("by_clerk_user_id", (q: any) =>
      q.eq("clerk_user_id", identity.subject),
    )
    .first();

  if (!user_profile) return null;

  return {
    clerk_user_id: user_profile.clerk_user_id,
    email: user_profile.email,
    display_name: user_profile.display_name,
    role: user_profile.role as UserRole,
    organization_id: user_profile.organization_id,
    team_id: user_profile.team_id,
    player_id: user_profile.player_id,
    official_id: user_profile.official_id,
  };
}

async function get_entity_category_from_db(
  ctx: { db: any },
  entity_type: string,
): Promise<DataCategory> {
  const normalized = entity_type.toLowerCase().replace(/[\s_-]/g, "");
  const category_record = await ctx.db
    .query("entity_data_categories")
    .withIndex("by_entity_type", (q: any) => q.eq("entity_type", normalized))
    .first();

  return (
    (category_record?.data_category as DataCategory) || "organisation_level"
  );
}

async function check_permission_from_db(
  ctx: { db: any },
  role: UserRole,
  data_category: DataCategory,
  action: DataAction,
): Promise<boolean> {
  const permission = await ctx.db
    .query("role_permissions")
    .withIndex("by_role_category", (q: any) =>
      q.eq("role", role).eq("data_category", data_category),
    )
    .first();

  if (!permission) return false;

  switch (action) {
    case "create":
      return permission.can_create;
    case "read":
      return permission.can_read;
    case "update":
      return permission.can_update;
    case "delete":
      return permission.can_delete;
    default:
      return false;
  }
}

export const get_current_user_profile = query({
  args: {},
  handler: async (ctx): Promise<UserProfile | null> => {
    return get_user_profile_from_context(ctx);
  },
});

export const check_entity_authorized = query({
  args: {
    entity_type: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args): Promise<AuthorizationResult> => {
    const user = await get_user_profile_from_context(ctx);
    if (!user) {
      return {
        is_authorized: false,
        reason: "Not authenticated",
      };
    }

    const data_category = await get_entity_category_from_db(
      ctx,
      args.entity_type,
    );
    const is_authorized = await check_permission_from_db(
      ctx,
      user.role,
      data_category,
      args.action as DataAction,
    );

    return {
      is_authorized,
      user_role: user.role,
      data_category,
      reason: is_authorized
        ? undefined
        : `Role "${user.role}" does not have "${args.action}" permission for "${data_category}" data`,
    };
  },
});

export const get_allowed_entity_actions = query({
  args: {
    entity_type: v.string(),
  },
  handler: async (ctx, args): Promise<DataAction[]> => {
    const user = await get_user_profile_from_context(ctx);
    if (!user) return [];

    const data_category = await get_entity_category_from_db(
      ctx,
      args.entity_type,
    );
    const permission = await ctx.db
      .query("role_permissions")
      .withIndex("by_role_category", (q: any) =>
        q.eq("role", user.role).eq("data_category", data_category),
      )
      .first();

    if (!permission) return [];

    const actions: DataAction[] = [];
    if (permission.can_create) actions.push("create");
    if (permission.can_read) actions.push("read");
    if (permission.can_update) actions.push("update");
    if (permission.can_delete) actions.push("delete");

    return actions;
  },
});

export const get_disabled_entity_actions = query({
  args: {
    entity_type: v.string(),
  },
  handler: async (ctx, args): Promise<DataAction[]> => {
    const all_actions: DataAction[] = ["create", "read", "update", "delete"];
    const user = await get_user_profile_from_context(ctx);
    if (!user) return all_actions;

    const data_category = await get_entity_category_from_db(
      ctx,
      args.entity_type,
    );
    const permission = await ctx.db
      .query("role_permissions")
      .withIndex("by_role_category", (q: any) =>
        q.eq("role", user.role).eq("data_category", data_category),
      )
      .first();

    if (!permission) return all_actions;

    const disabled: DataAction[] = [];
    if (!permission.can_create) disabled.push("create");
    if (!permission.can_read) disabled.push("read");
    if (!permission.can_update) disabled.push("update");
    if (!permission.can_delete) disabled.push("delete");

    return disabled;
  },
});

export const get_sidebar_menu = query({
  args: {},
  handler: async (ctx) => {
    const user = await get_user_profile_from_context(ctx);
    if (!user) return [];

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

    return Array.from(groups_map.values())
      .sort((a, b) => a.group_order - b.group_order)
      .map((group) => ({
        group_name: group.group_name,
        items: group.items.sort((a: any, b: any) => a.order - b.order),
      }));
  },
});

export const get_user_scope_filter = query({
  args: {
    entity_type: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await get_user_profile_from_context(ctx);
    if (!user) return null;

    if (user.role === "super_admin" || user.role === "org_admin") {
      return { organization_id: user.organization_id };
    }

    if (user.role === "team_manager") {
      return {
        organization_id: user.organization_id,
        team_id: user.team_id,
      };
    }

    if (user.role === "official") {
      const normalized = args.entity_type.toLowerCase().replace(/[\s_-]/g, "");
      if (normalized === "official") {
        return { id: user.official_id };
      }
      return { organization_id: user.organization_id };
    }

    if (user.role === "player") {
      const normalized = args.entity_type.toLowerCase().replace(/[\s_-]/g, "");
      if (normalized === "player" || normalized === "playerprofile") {
        return { id: user.player_id };
      }
      return { organization_id: user.organization_id };
    }

    return { organization_id: user.organization_id };
  },
});

export const upsert_user_profile = mutation({
  args: {
    clerk_user_id: v.string(),
    email: v.string(),
    display_name: v.string(),
    role: v.optional(v.string()),
    organization_id: v.optional(v.string()),
    team_id: v.optional(v.string()),
    player_id: v.optional(v.string()),
    official_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_profiles")
      .withIndex("by_clerk_user_id", (q: any) =>
        q.eq("clerk_user_id", args.clerk_user_id),
      )
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        display_name: args.display_name,
        last_login_at: now,
        updated_at: now,
      });
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("user_profiles", {
      clerk_user_id: args.clerk_user_id,
      email: args.email,
      display_name: args.display_name,
      role: args.role || "player",
      organization_id: args.organization_id,
      team_id: args.team_id,
      player_id: args.player_id,
      official_id: args.official_id,
      is_active: true,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    });

    return { id, action: "created" };
  },
});

export const update_user_role = mutation({
  args: {
    clerk_user_id: v.string(),
    role: v.string(),
    organization_id: v.optional(v.string()),
    team_id: v.optional(v.string()),
    player_id: v.optional(v.string()),
    official_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin_user = await get_user_profile_from_context(ctx);
    if (
      !admin_user ||
      (admin_user.role !== "super_admin" && admin_user.role !== "org_admin")
    ) {
      return { success: false, error: "Unauthorized to update user roles" };
    }

    const target_user = await ctx.db
      .query("user_profiles")
      .withIndex("by_clerk_user_id", (q: any) =>
        q.eq("clerk_user_id", args.clerk_user_id),
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
  handler: async (ctx, args) => {
    const user = await get_user_profile_from_context(ctx);
    if (!user) {
      return {
        can_access: false,
        reason: "Not authenticated",
      };
    }

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

    return {
      can_access: is_allowed,
      reason: is_allowed ? undefined : `Access denied to route: ${args.route}`,
      user_role: user.role,
    };
  },
});

export const get_user_profile_by_email = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user_profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q: any) =>
        q.eq("email", args.email.toLowerCase()),
      )
      .first();

    if (!user_profile) {
      return { found: false, profile: null };
    }

    return {
      found: true,
      profile: {
        id: user_profile._id,
        clerk_user_id: user_profile.clerk_user_id,
        email: user_profile.email,
        display_name: user_profile.display_name,
        role: user_profile.role,
        organization_id: user_profile.organization_id,
        team_id: user_profile.team_id,
        player_id: user_profile.player_id,
        official_id: user_profile.official_id,
        is_active: user_profile.is_active,
      },
    };
  },
});

export const link_clerk_user_to_profile = mutation({
  args: {
    email: v.string(),
    clerk_user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const user_profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q: any) =>
        q.eq("email", args.email.toLowerCase()),
      )
      .first();

    if (!user_profile) {
      return {
        success: false,
        error: "user_not_found",
        message:
          "No system user found with this email address. Please contact your organization administrator.",
      };
    }

    if (!user_profile.is_active) {
      return {
        success: false,
        error: "user_inactive",
        message:
          "Your account has been deactivated. Please contact your organization administrator.",
      };
    }

    if (
      user_profile.clerk_user_id &&
      user_profile.clerk_user_id !== args.clerk_user_id
    ) {
      return {
        success: false,
        error: "already_linked",
        message: "This email is already linked to a different account.",
      };
    }

    await ctx.db.patch(user_profile._id, {
      clerk_user_id: args.clerk_user_id,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      profile: {
        id: user_profile._id,
        email: user_profile.email,
        display_name: user_profile.display_name,
        role: user_profile.role,
        organization_id: user_profile.organization_id,
        team_id: user_profile.team_id,
        player_id: user_profile.player_id,
        official_id: user_profile.official_id,
      },
    };
  },
});

export const seed_super_admin = mutation({
  args: {
    email: v.string(),
    display_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q: any) =>
        q.eq("email", args.email.toLowerCase()),
      )
      .first();

    if (existing) {
      return {
        success: true,
        message: "Super admin already exists",
        profile_id: existing._id,
      };
    }

    const now = new Date().toISOString();
    const profile_id = await ctx.db.insert("user_profiles", {
      clerk_user_id: "",
      email: args.email.toLowerCase(),
      display_name: args.display_name || "Super Admin",
      role: "super_admin",
      organization_id: "*",
      team_id: "*",
      player_id: "*",
      official_id: "*",
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    return {
      success: true,
      message: "Super admin created successfully",
      profile_id,
    };
  },
});
