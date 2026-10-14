import { get_allowed_routes_for_role } from "$lib/adapters/iam/roleMenuRegistry";
import {
  USER_ROLE_ORDER,
  type UserRole,
} from "$lib/core/interfaces/ports/external/iam/AuthenticationPort";

import { is_route_in_accessible_set } from "./authGuardRoutes";
import { is_role_permitted_for_route_subpath } from "./authGuardSubpathPermissions";

const UNKNOWN_ROLE_ROUTE_DENIED_EVENT = "auth_guard_unknown_role_route_denied";
const NO_ACCESSIBLE_ROUTES: ReadonlySet<string> = new Set<string>();

function read_local_accessible_routes(role: UserRole): ReadonlySet<string> {
  if (USER_ROLE_ORDER.includes(role)) return get_allowed_routes_for_role(role);
  console.warn("[AuthGuard] Unknown role has no local route access", {
    event: UNKNOWN_ROLE_ROUTE_DENIED_EVENT,
    role,
  });
  return NO_ACCESSIBLE_ROUTES;
}

export function is_route_allowed_for_role_locally(
  pathname: string,
  role: UserRole,
): boolean {
  const accessible_routes = read_local_accessible_routes(role);
  if (!is_route_in_accessible_set(pathname, accessible_routes)) return false;
  return is_role_permitted_for_route_subpath(role, pathname);
}
