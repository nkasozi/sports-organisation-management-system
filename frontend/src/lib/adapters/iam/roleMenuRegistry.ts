import type { SidebarMenuGroup, UserRole } from "$lib/core/interfaces/ports";
import { EventBus } from "$lib/infrastructure/events/EventBus";
import { SUPER_ADMIN_MENU } from "./superAdminMenu";
import { ORG_ADMIN_MENU } from "./orgAdminMenu";
import { OFFICIALS_MANAGER_MENU, TEAM_MANAGER_MENU } from "./managerRoleMenus";
import {
  PLAYER_MENU,
  OFFICIAL_MENU,
  PUBLIC_VIEWER_MENU,
} from "./memberRoleMenus";

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
  super_admin: "/",
  org_admin: "/",
  officials_manager: "/",
  team_manager: "/",
  official: "/",
  player: "/",
  public_viewer: "/competition-results",
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Organisation Admin",
  officials_manager: "Officials Manager",
  team_manager: "Team Manager",
  official: "Official",
  player: "Player",
  public_viewer: "Public Viewer",
};

function extract_route_base(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  return "/" + segments[0];
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

const ALWAYS_ALLOWED_ROUTE_BASES: Set<string> = new Set(["/", "/match-report"]);

export function can_role_access_route(
  role: UserRole,
  pathname: string,
): { allowed: boolean; reason: string } {
  if (pathname === "/" || pathname === "") {
    return { allowed: true, reason: "" };
  }

  const route_base = extract_route_base(pathname);
  if (ALWAYS_ALLOWED_ROUTE_BASES.has(route_base)) {
    return { allowed: true, reason: "" };
  }

  const allowed_routes = get_allowed_routes_for_role(role);

  if (allowed_routes.has(pathname) || allowed_routes.has(route_base)) {
    return { allowed: true, reason: "" };
  }

  const role_display = ROLE_DISPLAY_NAMES[role] || role;
  const denial_reason = `Your role (${role_display}) does not have access to this page.`;

  EventBus.emit_access_denied(
    "route",
    pathname,
    "access",
    "navigation",
    denial_reason,
    role,
    "route_access_check",
  );

  return { allowed: false, reason: denial_reason };
}
