import { v } from "convex/values";

import { mutation } from "./_generated/server";
import {
  ACCESS_DENIED_MESSAGE,
  check_role_permission,
  get_system_user_from_context,
} from "./authorization_helpers";
import {
  can_caller_assign_role,
  is_seed_super_admin_allowed,
} from "./lib/role_security";

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
    if (!admin_result.success)
      return { success: false, error: admin_result.error };
    if (
      !check_role_permission(
        admin_result.data.role,
        "org_administrator_level",
        "update",
      )
    )
      return { success: false, error: ACCESS_DENIED_MESSAGE };
    const role_assignment_check = can_caller_assign_role(
      admin_result.data.role,
      args.role,
    );
    if (!role_assignment_check.success)
      return { success: false, error: role_assignment_check.error };
    const target_user = await ctx.db
      .query("system_users")
      .withIndex("by_email", (q: any) =>
        q.eq("email", args.target_email.toLowerCase()),
      )
      .first();
    if (!target_user) return { success: false, error: ACCESS_DENIED_MESSAGE };
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

export const seed_super_admin = mutation({
  args: { email: v.string(), display_name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const normalized_email = args.email.toLowerCase();
    const existing_super_admin_count = (
      await ctx.db.query("system_users").collect()
    ).filter(
      (user: any) => user.role === "super_admin" && user.status !== "inactive",
    ).length;
    let caller_role = "";
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.email) {
      const caller = await ctx.db
        .query("system_users")
        .withIndex("by_email", (q: any) =>
          q.eq("email", identity.email!.toLowerCase()),
        )
        .first();
      caller_role = caller ? caller.role : "";
    }
    const seed_allowed = is_seed_super_admin_allowed(
      caller_role,
      existing_super_admin_count,
    );
    if (!seed_allowed.success)
      return { success: false, error: seed_allowed.error };
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
    const user_id = await ctx.db.insert("system_users", {
      local_id: `super_admin_${normalized_email}`,
      email: normalized_email,
      name: args.display_name || "Super Admin",
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
