import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { auth_store } from "../stores/auth";
import { access_denial_store } from "../stores/accessDenial";
import type { UserProfile } from "../stores/auth";
import type { UserRole } from "$lib/core/interfaces/ports";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

export interface AuthGuardResult {
  success: boolean;
  profile: UserProfile | null;
  error_message: string;
}

interface RouteAccessCache {
  role: UserRole;
  accessible_routes: Set<string>;
  cached_at: number;
}

const ROUTE_CACHE_TTL_MS = 5 * 60 * 1000;

let route_access_cache: RouteAccessCache | null = null;

export function extract_route_base(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  return "/" + segments[0];
}

const ALWAYS_ALLOWED_ROUTE_BASES: Set<string> = new Set([
  "/",
  "/match-report",
  "/competition-results",
  "/calendar",
]);

export function is_route_in_accessible_set(
  pathname: string,
  accessible_routes: Set<string>,
): boolean {
  if (pathname === "/" || pathname === "") return true;
  const route_base = extract_route_base(pathname);
  if (ALWAYS_ALLOWED_ROUTE_BASES.has(route_base)) return true;
  return accessible_routes.has(pathname) || accessible_routes.has(route_base);
}

function is_cache_valid_for_role(role: UserRole): boolean {
  if (!route_access_cache) return false;
  if (route_access_cache.role !== role) return false;
  return Date.now() - route_access_cache.cached_at < ROUTE_CACHE_TTL_MS;
}

async function load_accessible_routes(role: UserRole): Promise<Set<string>> {
  const adapter = get_authorization_adapter();
  const result = await adapter.get_accessible_routes_for_role(role);

  if (!result.success) {
    console.error(
      `[AuthGuard] Failed to load accessible routes: ${result.error}`,
    );
    return new Set<string>();
  }

  console.log(
    `[AuthGuard] Loaded ${result.data.length} accessible routes for role: ${role}`,
  );
  return new Set(result.data);
}

export function invalidate_route_access_cache(): boolean {
  const had_cache = route_access_cache !== null;
  route_access_cache = null;
  return had_cache;
}

function get_role_display_name(role: UserRole): string {
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
    case "":
      return "Dashboard";
    default:
      return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}

export async function check_route_access(
  pathname: string,
): Promise<{ allowed: boolean; message: string }> {
  const auth_state = get(auth_store);

  if (!auth_state.is_initialized) {
    await auth_store.initialize();
  }

  const updated_state = get(auth_store);
  const profile = updated_state.current_profile;

  if (!profile) {
    const route_base = extract_route_base(pathname);
    if (ALWAYS_ALLOWED_ROUTE_BASES.has(route_base)) {
      return { allowed: true, message: "" };
    }
    return {
      allowed: false,
      message: "Please select a user profile to access this page.",
    };
  }

  if (!is_cache_valid_for_role(profile.role)) {
    const accessible_routes = await load_accessible_routes(profile.role);
    route_access_cache = {
      role: profile.role,
      accessible_routes,
      cached_at: Date.now(),
    };
  }

  if (
    is_route_in_accessible_set(pathname, route_access_cache!.accessible_routes)
  ) {
    return { allowed: true, message: "" };
  }

  const page_name = format_route_as_page_name(pathname);

  return {
    allowed: false,
    message: `Your current role (${get_role_display_name(profile.role)}) does not have access to the "${page_name}" page.`,
  };
}

export async function ensure_route_access(pathname: string): Promise<boolean> {
  const result = await check_route_access(pathname);

  if (!result.allowed) {
    access_denial_store.set_denial(pathname, result.message);
    goto("/");
    return false;
  }

  return true;
}

export async function ensure_auth_profile(): Promise<AuthGuardResult> {
  const auth_state = get(auth_store);

  if (!auth_state.is_initialized) {
    console.log(
      "[AuthGuard] Auth not initialized, triggering initialization...",
    );
    await auth_store.initialize();
  }

  const updated_state = get(auth_store);

  if (!updated_state.current_profile) {
    console.error("[AuthGuard] No auth profile found after initialization");
    return {
      success: false,
      profile: null,
      error_message:
        "Unable to load data: No user profile is set. Please select a user profile to continue.",
    };
  }

  return {
    success: true,
    profile: updated_state.current_profile,
    error_message: "",
  };
}

export function get_current_auth_profile(): UserProfile | null {
  const auth_state = get(auth_store);
  return auth_state.current_profile;
}

export function is_auth_initialized(): boolean {
  const auth_state = get(auth_store);
  return auth_state.is_initialized;
}
