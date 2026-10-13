import { get } from "svelte/store";

import { goto } from "$app/navigation";
import type { UserRole } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import { normalize_auth_profile_state } from "$lib/presentation/stores/authTypes";

import { access_denial_store } from "../stores/accessDenial";
import type { AuthState, UserProfile } from "../stores/auth";
import { auth_store } from "../stores/auth";
import {
  AUTH_GUARD_EVENTS,
  AUTH_GUARD_MESSAGES,
  ROOT_ROUTE_PATH,
} from "./authGuardConstants";
import {
  is_pathname_in_route_access_cache,
  refresh_route_access_cache_for_role,
} from "./authGuardRouteAccessCache";
import {
  ALWAYS_ALLOWED_ROUTE_BASES,
  extract_route_base,
  format_route_as_page_name,
  get_role_display_name,
} from "./authGuardRoutes";

export { invalidate_route_access_cache } from "./authGuardRouteAccessCache";
export {
  extract_route_base,
  format_route_as_page_name,
  is_route_in_accessible_set,
} from "./authGuardRoutes";

type AuthGuardProfileState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserProfile };

type AuthGuardResult =
  | {
      success: false;
      profile_state: { status: typeof PRESENCE_STATUS.MISSING };
      error_message: string;
    }
  | {
      success: true;
      profile_state: {
        status: typeof PRESENCE_STATUS.PRESENT;
        profile: UserProfile;
      };
      error_message: string;
    };

function build_auth_guard_profile_state(
  current_profile: AuthState["current_profile"] | UserProfile | undefined,
): AuthGuardProfileState {
  const current_profile_state = normalize_auth_profile_state(current_profile);

  if (current_profile_state.status !== PRESENCE_STATUS.PRESENT) {
    return { status: PRESENCE_STATUS.MISSING };
  }

  return {
    status: PRESENCE_STATUS.PRESENT,
    profile: current_profile_state.profile,
  };
}

type RouteAccessCheckResult = { allowed: boolean; message: string };

const ROUTE_ACCESS_ALLOWED_RESULT: RouteAccessCheckResult = {
  allowed: true,
  message: "",
};

function build_unverified_route_access_result(
  pathname: string,
  message: string,
): RouteAccessCheckResult {
  const route_base = extract_route_base(pathname);
  if (ALWAYS_ALLOWED_ROUTE_BASES.has(route_base)) {
    return { ...ROUTE_ACCESS_ALLOWED_RESULT };
  }
  return { allowed: false, message };
}

function build_role_denied_route_access_result(
  pathname: string,
  role: UserRole,
): RouteAccessCheckResult {
  const page_name = format_route_as_page_name(pathname);

  return {
    allowed: false,
    message: `Your current role (${get_role_display_name(role)}) does not have access to the "${page_name}" page.`,
  };
}

async function initialize_auth_when_needed(): Promise<boolean> {
  if (get(auth_store).is_initialized) return true;
  console.log("[AuthGuard] Initializing auth", {
    event: AUTH_GUARD_EVENTS.AUTH_INITIALIZATION_STARTED,
  });
  const initialize_result = await auth_store.initialize();
  if (initialize_result.success) return true;
  console.error("[AuthGuard] Auth initialization failed", {
    event: AUTH_GUARD_EVENTS.AUTH_INITIALIZATION_FAILED,
    error: initialize_result.error,
  });
  return false;
}

export async function check_route_access(
  pathname: string,
): Promise<RouteAccessCheckResult> {
  if (!(await initialize_auth_when_needed())) {
    return build_unverified_route_access_result(
      pathname,
      AUTH_GUARD_MESSAGES.SESSION_UNAVAILABLE,
    );
  }
  const profile_state = build_auth_guard_profile_state(
    get(auth_store).current_profile,
  );

  if (profile_state.status !== PRESENCE_STATUS.PRESENT) {
    return build_unverified_route_access_result(
      pathname,
      AUTH_GUARD_MESSAGES.PROFILE_REQUIRED,
    );
  }
  const profile = profile_state.profile;

  const refresh_result = await refresh_route_access_cache_for_role(
    profile.role,
  );
  if (!refresh_result.success) {
    return build_unverified_route_access_result(pathname, refresh_result.error);
  }

  if (is_pathname_in_route_access_cache(pathname)) {
    return { ...ROUTE_ACCESS_ALLOWED_RESULT };
  }

  return build_role_denied_route_access_result(pathname, profile.role);
}

export async function ensure_route_access(pathname: string): Promise<boolean> {
  const result = await check_route_access(pathname);
  if (result.allowed) return true;
  access_denial_store.set_denial(pathname, result.message);
  await goto(ROOT_ROUTE_PATH);
  return false;
}

export async function ensure_auth_profile(): Promise<AuthGuardResult> {
  const missing_profile_state = { status: PRESENCE_STATUS.MISSING } as const;
  if (!(await initialize_auth_when_needed())) {
    return {
      success: false,
      profile_state: missing_profile_state,
      error_message: AUTH_GUARD_MESSAGES.SESSION_UNAVAILABLE,
    };
  }
  const profile_state = build_auth_guard_profile_state(
    get(auth_store).current_profile,
  );

  if (profile_state.status !== PRESENCE_STATUS.PRESENT) {
    console.error("[AuthGuard] No auth profile after initialization", {
      event: AUTH_GUARD_EVENTS.AUTH_PROFILE_MISSING,
    });
    return {
      success: false,
      profile_state,
      error_message: AUTH_GUARD_MESSAGES.PROFILE_REQUIRED_FOR_DATA,
    };
  }

  return {
    success: true,
    profile_state,
    error_message: "",
  };
}

export function get_current_auth_profile_state(): AuthGuardProfileState {
  const auth_state = get(auth_store);
  return build_auth_guard_profile_state(auth_state.current_profile);
}

export function is_auth_initialized(): boolean {
  const auth_state = get(auth_store);
  return auth_state.is_initialized;
}
