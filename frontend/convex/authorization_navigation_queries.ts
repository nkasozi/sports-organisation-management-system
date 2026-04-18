import { v } from "convex/values";

import { query } from "./_generated/server";
import {
  ACCESS_DENIED_MESSAGE,
  get_system_user_from_context,
} from "./authorization_helpers";
import type { ConvexResult } from "./lib/auth_middleware";

const EMPTY_SCOPE_VALUE = "";

function get_scope_filter_value(value: unknown): string {
  return typeof value === "string" ? value : EMPTY_SCOPE_VALUE;
}

export const get_sidebar_menu = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<ConvexResult<Array<{ group_name: string; items: any[] }>>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };
    const menu_items = await ctx.db
      .query("sidebar_menu_items")
      .withIndex("by_role", (q: any) => q.eq("role", user_result.data.role))
      .collect();
    const groups_map = new Map<
      string,
      { group_name: string; group_order: number; items: any[] }
    >();
    for (const item of menu_items) {
      if (!groups_map.has(item.group_name))
        groups_map.set(item.group_name, {
          group_name: item.group_name,
          group_order: item.group_order,
          items: [],
        });
      groups_map.get(item.group_name)!.items.push({
        name: item.item_name,
        href: item.item_href,
        icon: item.item_icon,
        order: item.item_order,
      });
    }
    return {
      success: true,
      data: Array.from(groups_map.values())
        .sort((a, b) => a.group_order - b.group_order)
        .map((group) => ({
          group_name: group.group_name,
          items: group.items.sort((a: any, b: any) => a.order - b.order),
        })),
    };
  },
});

export const get_user_scope_filter = query({
  args: { entity_type: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<Record<string, string>>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };
    const user = user_result.data;
    if (user.organization_id === "*") return { success: true, data: {} };
    if (user.role === "org_admin")
      return {
        success: true,
        data: { organization_id: get_scope_filter_value(user.organization_id) },
      };
    if (user.role === "team_manager")
      return {
        success: true,
        data: {
          organization_id: get_scope_filter_value(user.organization_id),
          team_id: get_scope_filter_value(user.team_id),
        },
      };
    if (user.role === "official") {
      const normalized = args.entity_type.toLowerCase().replace(/[\s_-]/g, "");
      return normalized === "official"
        ? {
            success: true,
            data: { id: get_scope_filter_value(user.official_id) },
          }
        : {
            success: true,
            data: {
              organization_id: get_scope_filter_value(user.organization_id),
            },
          };
    }
    if (user.role === "player") {
      const normalized = args.entity_type.toLowerCase().replace(/[\s_-]/g, "");
      return normalized === "player" || normalized === "playerprofile"
        ? {
            success: true,
            data: { id: get_scope_filter_value(user.player_id) },
          }
        : {
            success: true,
            data: {
              organization_id: get_scope_filter_value(user.organization_id),
            },
          };
    }
    return {
      success: true,
      data: { organization_id: get_scope_filter_value(user.organization_id) },
    };
  },
});

export const can_access_route = query({
  args: { route: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<ConvexResult<{ user_role: string; can_access: boolean }>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success)
      return { success: false, error: user_result.error };
    const menu_items = await ctx.db
      .query("sidebar_menu_items")
      .withIndex("by_role", (q: any) => q.eq("role", user_result.data.role))
      .collect();
    const is_allowed = menu_items
      .map((item: any) => item.item_href)
      .some(
        (route: string) =>
          args.route === route ||
          args.route.startsWith(route + "/") ||
          route === "/" ||
          args.route === "/",
      );
    return is_allowed
      ? {
          success: true,
          data: { user_role: user_result.data.role, can_access: true },
        }
      : { success: false, error: ACCESS_DENIED_MESSAGE };
  },
});
