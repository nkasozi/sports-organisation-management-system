import type { SidebarMenuGroup, UserRole } from "$lib/core/interfaces/ports";
import { USER_ROLE_DISPLAY_NAMES } from "$lib/core/interfaces/ports";
import { EventBus } from "$lib/infrastructure/events/EventBus";

import { IAM_ROUTE, ROUTE_ACCESS_AUDIT } from "./iamConstants";
import { OFFICIALS_MANAGER_MENU, TEAM_MANAGER_MENU } from "./managerRoleMenus";
import {
  OFFICIAL_MENU,
  PLAYER_MENU,
  PUBLIC_VIEWER_MENU,
} from "./memberRoleMenus";
import { ORG_ADMIN_MENU } from "./orgAdminMenu";
import { SUPER_ADMIN_MENU } from "./superAdminMenu";

const HOW_IT_WORKS_MENU_ITEM = {
  name: "How It Works",
  href: IAM_ROUTE.HOW_IT_WORKS,
  icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
};

function with_how_it_works(menu: SidebarMenuGroup[]): SidebarMenuGroup[] {
  const [home_group, ...other_groups] = menu;
  return [
    { ...home_group, items: [...home_group.items, HOW_IT_WORKS_MENU_ITEM] },
    ...other_groups,
  ];
}

const ROLE_MENUS: Record<UserRole, SidebarMenuGroup[]> = {
  super_admin: with_how_it_works(SUPER_ADMIN_MENU),
  org_admin: with_how_it_works(ORG_ADMIN_MENU),
  officials_manager: with_how_it_works(OFFICIALS_MANAGER_MENU),
  team_manager: with_how_it_works(TEAM_MANAGER_MENU),
  official: with_how_it_works(OFFICIAL_MENU),
  player: with_how_it_works(PLAYER_MENU),
  public_viewer: with_how_it_works(PUBLIC_VIEWER_MENU),
};

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  super_admin: IAM_ROUTE.HOME,
  org_admin: IAM_ROUTE.HOME,
  officials_manager: IAM_ROUTE.HOME,
  team_manager: IAM_ROUTE.HOME,
  official: IAM_ROUTE.HOME,
  player: IAM_ROUTE.HOME,
  public_viewer: IAM_ROUTE.COMPETITION_RESULTS,
};

function extract_route_base(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return IAM_ROUTE.HOME;
  return `${IAM_ROUTE.HOME}${segments[0]}`;
}

function get_all_routes_from_menu(menu: SidebarMenuGroup[]): Set<string> {
  const routes = new Set<string>();
  for (const group of menu) {
    for (const item of group.items) {
      routes.add(item.href);
      const base = extract_route_base(item.href);
      if (base !== item.href) {
        routes.add(base);
      }
    }
  }
  return routes;
}

export function get_allowed_routes_for_role(role: UserRole): Set<string> {
  return get_all_routes_from_menu(ROLE_MENUS[role]);
}

export function get_sidebar_menu_for_role(role: UserRole): SidebarMenuGroup[] {
  return ROLE_MENUS[role];
}

export function get_default_route_for_role(role: UserRole): string {
  return ROLE_DEFAULT_ROUTES[role];
}

const ALWAYS_ALLOWED_ROUTE_BASES: Set<string> = new Set([
  IAM_ROUTE.HOME,
  IAM_ROUTE.MATCH_REPORT,
  IAM_ROUTE.HELP,
  IAM_ROUTE.HOW_IT_WORKS,
]);
const ROUTE_ACCESS_GRANTED = { allowed: true, reason: "" } as const;

export function can_role_access_route(
  role: UserRole,
  pathname: string,
): { allowed: boolean; reason: string } {
  if (pathname.length === 0 || pathname === IAM_ROUTE.HOME) {
    return ROUTE_ACCESS_GRANTED;
  }

  const route_base = extract_route_base(pathname);
  if (ALWAYS_ALLOWED_ROUTE_BASES.has(route_base)) {
    return ROUTE_ACCESS_GRANTED;
  }

  const allowed_routes = get_allowed_routes_for_role(role);

  if (allowed_routes.has(pathname) || allowed_routes.has(route_base)) {
    return ROUTE_ACCESS_GRANTED;
  }

  const role_display = USER_ROLE_DISPLAY_NAMES[role] || role;
  const denial_reason = `Your role (${role_display}) does not have access to this page.`;

  EventBus.emit_access_denied(
    ROUTE_ACCESS_AUDIT.ENTITY_TYPE,
    pathname,
    ROUTE_ACCESS_AUDIT.ACTION,
    ROUTE_ACCESS_AUDIT.DATA_CATEGORY,
    denial_reason,
    role,
    ROUTE_ACCESS_AUDIT.SOURCE,
  );

  return { allowed: false, reason: denial_reason };
}
