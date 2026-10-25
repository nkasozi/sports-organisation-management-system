import type { UserRole } from "$lib/core/interfaces/ports";

import {
  DASHBOARD_PAGE_NAME,
  EMPTY_ROUTE_PATH,
  ROOT_ROUTE_PATH,
} from "./authGuardConstants";

export function extract_route_base(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  return "/" + segments[0];
}

export const ALWAYS_ALLOWED_ROUTE_BASES: Set<string> = new Set([
  "/",
  "/match-report",
  "/competition-results",
  "/calendar",
  "/profile",
  "/team-profile",
  "/help",
  "/how-it-works",
]);

export function is_route_in_accessible_set(
  pathname: string,
  accessible_routes: ReadonlySet<string>,
): boolean {
  if (pathname === ROOT_ROUTE_PATH || pathname === EMPTY_ROUTE_PATH)
    return true;
  const route_base = extract_route_base(pathname);
  if (ALWAYS_ALLOWED_ROUTE_BASES.has(route_base)) return true;
  return accessible_routes.has(pathname) || accessible_routes.has(route_base);
}

export function get_role_display_name(role: UserRole): string {
  const display_names: Record<UserRole, string> = {
    super_admin: "Super Admin",
    org_admin: "Organisation Admin",
    officials_manager: "Officials Manager",
    team_manager: "Team Manager",
    official: "Official",
    player: "Player",
    public_viewer: "Public Viewer",
  };
  return display_names[role] || role;
}

export function format_route_as_page_name(pathname: string): string {
  const base = extract_route_base(pathname);
  const slug = base.replace(/^\//, "");

  switch (slug) {
    case EMPTY_ROUTE_PATH:
      return DASHBOARD_PAGE_NAME;
    default:
      return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}
