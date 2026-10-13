import type { UserRole } from "$lib/core/interfaces/ports";
import { type Option, OptionStatus } from "$lib/core/types/Option";

import {
  CACHED_ROUTE_ACCESS_STATUS,
  type CachedRouteAccessStatus,
} from "./authGuardRouteAccessCache";
import { is_route_guard_exempt } from "./layoutLogic";

export interface BeforeNavigationGuardDependencies {
  is_app_ready(): boolean;
  read_current_role(): Option<UserRole>;
  evaluate_cached_route_access(
    pathname: string,
    role: UserRole,
  ): CachedRouteAccessStatus;
  record_denial(pathname: string, role: UserRole): boolean;
}

export interface CompletedNavigationGuardDependencies {
  is_app_ready(): boolean;
  ensure_route_access(pathname: string): Promise<boolean>;
}

const NAVIGATION_CANCELLED_EVENT = "layout_navigation_cancelled_by_guard";

function is_navigation_guarded(
  is_app_ready: boolean,
  pathname: string,
): boolean {
  return is_app_ready && !is_route_guard_exempt(pathname);
}

export function should_cancel_navigation(
  dependencies: BeforeNavigationGuardDependencies,
  target_pathname: string,
): boolean {
  if (!is_navigation_guarded(dependencies.is_app_ready(), target_pathname))
    return false;
  const role_option = dependencies.read_current_role();
  if (role_option.status === OptionStatus.NONE) return false;
  const cached_access = dependencies.evaluate_cached_route_access(
    target_pathname,
    role_option.value,
  );
  if (cached_access !== CACHED_ROUTE_ACCESS_STATUS.DENIED) return false;
  console.warn("[Layout] Navigation blocked for the current role", {
    event: NAVIGATION_CANCELLED_EVENT,
    target_pathname,
    role: role_option.value,
  });
  dependencies.record_denial(target_pathname, role_option.value);
  return true;
}

export async function guard_completed_navigation(
  dependencies: CompletedNavigationGuardDependencies,
  pathname: string,
): Promise<boolean> {
  if (!is_navigation_guarded(dependencies.is_app_ready(), pathname))
    return true;
  return dependencies.ensure_route_access(pathname);
}
