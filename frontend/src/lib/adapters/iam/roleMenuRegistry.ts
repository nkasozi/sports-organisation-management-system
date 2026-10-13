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

const ROLE_MENUS: Record<UserRole, SidebarMenuGroup[]> = {
  super_admin: SUPER_ADMIN_MENU,
  org_admin: ORG_ADMIN_MENU,
  officials_manager: OFFICIALS_MANAGER_MENU,
  team_manager: TEAM_MANAGER_MENU,
  official: OFFICIAL_MENU,
  player: PLAYER_MENU,
  public_viewer: PUBLIC_VIEWER_MENU,
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
