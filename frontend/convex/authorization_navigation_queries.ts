import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { get_system_user_from_context } from "./authorization_helpers";
import type { ConvexResult } from "./lib/auth_middleware";
import { ConvexErrorCode, log_convex_failure } from "./lib/convex_errors";
import { build_user_scope_filter } from "./lib/user_scope_filter";

const SIDEBAR_MENU_TABLE_NAME = "sidebar_menu_items";
const ROLE_INDEX_NAME = "by_role";
const ROOT_ROUTE = "/";
const ROUTE_ACCESS_DENIED_EVENT = "route_access_denied";

interface SidebarMenuItem {
  name: string;
  href: string;
  icon: string;
  order: number;
}

interface SidebarMenuGroup {
  group_name: string;
  group_order: number;
  items: SidebarMenuItem[];
}

async function load_role_menu_items(
  ctx: QueryCtx,
  role: string,
): Promise<Array<Doc<"sidebar_menu_items">>> {
  return ctx.db
    .query(SIDEBAR_MENU_TABLE_NAME)
    .withIndex(ROLE_INDEX_NAME, (query) => query.eq("role", role))
    .collect();
}

function group_menu_items(
  menu_items: Array<Doc<"sidebar_menu_items">>,
): Array<{ group_name: string; items: SidebarMenuItem[] }> {
  const groups_map = new Map<string, SidebarMenuGroup>();
  for (const item of menu_items) {
    const group = groups_map.get(item.group_name) ?? {
      group_name: item.group_name,
      group_order: item.group_order,
      items: [],
    };
    group.items.push({
      name: item.item_name,
      href: item.item_href,
      icon: item.item_icon,
      order: item.item_order,
    });
    groups_map.set(item.group_name, group);
  }
  return Array.from(groups_map.values())
    .sort((left, right) => left.group_order - right.group_order)
    .map((group) => ({
      group_name: group.group_name,
      items: group.items.sort((left, right) => left.order - right.order),
    }));
}

function is_route_allowed(
  requested_route: string,
  menu_route: string,
): boolean {
  return (
    requested_route === menu_route ||
    requested_route.startsWith(`${menu_route}${ROOT_ROUTE}`) ||
    menu_route === ROOT_ROUTE ||
    requested_route === ROOT_ROUTE
  );
}

export const get_sidebar_menu = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    ConvexResult<Array<{ group_name: string; items: SidebarMenuItem[] }>>
  > => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success) return user_result;
    return {
      success: true,
      data: group_menu_items(
        await load_role_menu_items(ctx, user_result.data.role),
      ),
    };
  },
});

export const get_user_scope_filter = query({
  args: { entity_type: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<Record<string, string>>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success) return user_result;
    return {
      success: true,
      data: build_user_scope_filter(user_result.data, args.entity_type),
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
    if (!user_result.success) return user_result;
    const menu_items = await load_role_menu_items(ctx, user_result.data.role);
    const is_allowed = menu_items.some((item) =>
      is_route_allowed(args.route, item.item_href),
    );
    return is_allowed
      ? {
          success: true,
          data: { user_role: user_result.data.role, can_access: true },
        }
      : log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
          event: ROUTE_ACCESS_DENIED_EVENT,
          role: user_result.data.role,
          route: args.route,
        });
  },
});
