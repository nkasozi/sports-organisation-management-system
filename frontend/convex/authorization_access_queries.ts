import { v } from "convex/values";

import { query } from "./_generated/server";
import {
  ACCESS_DENIED_MESSAGE,
  type AuthorizationResult,
  check_role_permission,
  type DataAction,
  get_actions_from_permissions,
  get_entity_data_category,
  get_system_user_from_context,
  mask_email_for_logging,
  type SystemUser,
} from "./authorization_helpers";
import type { ConvexResult } from "./lib/auth_middleware";
import { SHARED_ROLE_PERMISSIONS } from "./shared_permission_definitions";

export const check_user_access = query({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<{ email: string }>> => {
    const request_id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const system_user = await ctx.db
      .query("system_users")
      .withIndex("by_email", (q: any) =>
        q.eq("email", args.email.toLowerCase()),
      )
      .first();
    if (!system_user) {
      console.log("[authorization] Access check failed", {
        event: "access_check_denied",
        request_id,
        email: mask_email_for_logging(args.email.toLowerCase()),
        reason: "user_not_found",
      });
      return { success: false, error: ACCESS_DENIED_MESSAGE };
    }
    if (system_user.status === "inactive") {
      console.log("[authorization] Access check failed", {
        event: "access_check_denied",
        request_id,
        email: mask_email_for_logging(args.email.toLowerCase()),
        reason: "account_inactive",
      });
      return { success: false, error: ACCESS_DENIED_MESSAGE };
    }
    console.log("[authorization] Access check succeeded", {
      event: "access_check_granted",
      request_id,
      email: mask_email_for_logging(system_user.email),
      role: system_user.role,
    });
    return { success: true, data: { email: system_user.email } };
  },
});

export const get_current_user_profile = query({
  args: {},
  handler: async (ctx): Promise<ConvexResult<SystemUser>> =>
    get_system_user_from_context(ctx),
});

export const check_entity_authorized = query({
  args: { entity_type: v.string(), action: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<AuthorizationResult>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };
    const data_category = get_entity_data_category(args.entity_type);
    const is_authorized = check_role_permission(
      user_result.data.role,
      data_category,
      args.action as DataAction,
    );
    return {
      success: true,
      data: {
        is_authorized,
        user_role: user_result.data.role,
        data_category,
        reason: is_authorized
          ? void 0
          : `Role "${user_result.data.role}" does not have "${args.action}" permission for "${data_category}" data`,
      },
    };
  },
});

export const get_allowed_entity_actions = query({
  args: { entity_type: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<DataAction[]>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };
    const category_permissions =
      SHARED_ROLE_PERMISSIONS[user_result.data.role]?.[
        get_entity_data_category(args.entity_type)
      ];
    return {
      success: true,
      data: category_permissions
        ? get_actions_from_permissions(category_permissions)
        : [],
    };
  },
});

export const get_disabled_entity_actions = query({
  args: { entity_type: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<DataAction[]>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };
    const data_category = get_entity_data_category(args.entity_type);
    return {
      success: true,
      data: (["create", "read", "update", "delete"] as DataAction[]).filter(
        (action) =>
          !check_role_permission(user_result.data.role, data_category, action),
      ),
    };
  },
});
