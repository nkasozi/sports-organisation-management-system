import type { UserRole } from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

import {
  AUTH_GUARD_EVENTS,
  AUTH_GUARD_MESSAGES,
  ROUTE_ACCESS_CACHE_STATUS,
} from "./authGuardConstants";
import { is_route_in_accessible_set } from "./authGuardRoutes";

interface RouteAccessCache {
  role: UserRole;
  accessible_routes: Set<string>;
  cached_at: number;
}

type RouteAccessCacheState =
  | { status: typeof ROUTE_ACCESS_CACHE_STATUS.EMPTY }
  | { status: typeof ROUTE_ACCESS_CACHE_STATUS.LOAD_FAILED; role: UserRole }
  | { status: typeof ROUTE_ACCESS_CACHE_STATUS.READY; cache: RouteAccessCache };

const ROUTE_CACHE_TTL_MS = 5 * 60 * 1000;
const EMPTY_ACCESSIBLE_ROUTES: ReadonlySet<string> = new Set<string>();
let route_access_cache_state: RouteAccessCacheState = {
  status: ROUTE_ACCESS_CACHE_STATUS.EMPTY,
};

function is_cache_valid_for_role(
  state: RouteAccessCacheState,
  role: UserRole,
  now: number,
): boolean {
  switch (state.status) {
    case ROUTE_ACCESS_CACHE_STATUS.EMPTY:
    case ROUTE_ACCESS_CACHE_STATUS.LOAD_FAILED:
      return false;
    case ROUTE_ACCESS_CACHE_STATUS.READY:
      return (
        state.cache.role === role &&
        now - state.cache.cached_at < ROUTE_CACHE_TTL_MS
      );
  }
}

async function load_accessible_routes(
  role: UserRole,
): Promise<Result<Set<string>>> {
  const adapter = get_authorization_adapter();
  const result = await adapter.get_accessible_routes_for_role(role);
  if (!result.success) {
    console.error("[AuthGuard] Failed to load accessible routes", {
      event: AUTH_GUARD_EVENTS.ROUTE_ACCESS_LOAD_FAILED,
      role,
      error: result.error,
    });
    return create_failure_result(AUTH_GUARD_MESSAGES.ROUTE_ACCESS_UNAVAILABLE);
  }

  console.log("[AuthGuard] Loaded accessible routes", {
    event: AUTH_GUARD_EVENTS.ROUTE_ACCESS_LOADED,
    role,
    route_count: result.data.length,
  });
  return create_success_result(new Set(result.data));
}

export function invalidate_route_access_cache(): boolean {
  const had_cache =
    route_access_cache_state.status === ROUTE_ACCESS_CACHE_STATUS.READY;
  route_access_cache_state = { status: ROUTE_ACCESS_CACHE_STATUS.EMPTY };
  return had_cache;
}

export async function refresh_route_access_cache_for_role(
  role: UserRole,
): Promise<Result<boolean>> {
  if (is_cache_valid_for_role(route_access_cache_state, role, Date.now())) {
    return create_success_result(false);
  }
  const load_result = await load_accessible_routes(role);
  if (!load_result.success) {
    route_access_cache_state = {
      status: ROUTE_ACCESS_CACHE_STATUS.LOAD_FAILED,
      role,
    };
    return load_result;
  }
  route_access_cache_state = {
    status: ROUTE_ACCESS_CACHE_STATUS.READY,
    cache: {
      role,
      accessible_routes: load_result.data,
      cached_at: Date.now(),
    },
  };
  return create_success_result(true);
}

function get_cached_accessible_routes(
  state: RouteAccessCacheState,
): ReadonlySet<string> {
  switch (state.status) {
    case ROUTE_ACCESS_CACHE_STATUS.EMPTY:
    case ROUTE_ACCESS_CACHE_STATUS.LOAD_FAILED:
      return EMPTY_ACCESSIBLE_ROUTES;
    case ROUTE_ACCESS_CACHE_STATUS.READY:
      return state.cache.accessible_routes;
  }
}

export function is_pathname_in_route_access_cache(pathname: string): boolean {
  if (route_access_cache_state.status === ROUTE_ACCESS_CACHE_STATUS.EMPTY) {
    return false;
  }
  return is_route_in_accessible_set(
    pathname,
    get_cached_accessible_routes(route_access_cache_state),
  );
}
