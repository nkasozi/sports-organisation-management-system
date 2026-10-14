import type { BeforeNavigate } from "@sveltejs/kit";
import { get } from "svelte/store";

import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import type { UserRole } from "$lib/core/interfaces/ports";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import { EventBus } from "$lib/infrastructure/events/EventBus";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";
import { auth_store } from "$lib/presentation/stores/auth";

import { ensure_route_access } from "./authGuard";
import { ROOT_ROUTE_PATH } from "./authGuardConstants";
import { is_route_allowed_for_role_locally } from "./authGuardLocalRouteAccess";
import { evaluate_cached_route_access } from "./authGuardRouteAccessCache";
import {
  format_route_as_page_name,
  get_role_display_name,
} from "./authGuardRoutes";
import { is_route_guard_exempt } from "./layoutLogic";
import {
  type BeforeNavigationGuardDependencies,
  type CompletedNavigationGuardDependencies,
  guard_completed_navigation,
  reveal_page_after_initial_route_decision,
  should_cancel_navigation,
} from "./layoutNavigationGuard";
import { PRESENCE_STATUS } from "./presenceStatus";

function read_current_role(): Option<UserRole> {
  const current_profile = get(auth_store).current_profile;
  return current_profile.status === PRESENCE_STATUS.PRESENT
    ? create_some_option(current_profile.profile.role)
    : create_none_option<UserRole>();
}

function build_navigation_denial_message(
  pathname: string,
  role: UserRole,
): string {
  return `Your current role (${get_role_display_name(role)}) does not have access to the "${format_route_as_page_name(pathname)}" page.`;
}

function record_navigation_denial(pathname: string, role: UserRole): boolean {
  access_denial_store.set_denial(
    pathname,
    build_navigation_denial_message(pathname, role),
  );
  queueMicrotask(() => void goto(ROOT_ROUTE_PATH));
  return true;
}

function record_page_viewed(pathname: string): boolean {
  if (!get(is_signed_in)) return false;
  EventBus.emit_page_viewed(pathname, document.title || pathname);
  return true;
}

function cancel_navigation_when_denied(
  navigation: BeforeNavigate,
  dependencies: BeforeNavigationGuardDependencies,
): boolean {
  const target_pathname = navigation.to?.url?.pathname;
  if (!target_pathname || navigation.willUnload) return false;
  if (!should_cancel_navigation(dependencies, target_pathname)) return false;
  navigation.cancel();
  return true;
}

async function guard_and_record_navigation(
  pathname: string,
  dependencies: CompletedNavigationGuardDependencies,
): Promise<boolean> {
  const access_granted = await guard_completed_navigation(
    dependencies,
    pathname,
  );
  if (!access_granted || is_route_guard_exempt(pathname)) return false;
  return record_page_viewed(pathname);
}

export function register_root_layout_navigation_guards(
  is_app_ready: () => boolean,
): boolean {
  const before_dependencies =
    create_before_navigation_guard_dependencies(is_app_ready);
  const completed_dependencies =
    create_completed_navigation_guard_dependencies(is_app_ready);
  beforeNavigate((navigation: BeforeNavigate) => {
    cancel_navigation_when_denied(navigation, before_dependencies);
  });
  afterNavigate(({ to }) => {
    const pathname = to?.url?.pathname;
    if (!is_app_ready() || !pathname) return;
    void guard_and_record_navigation(pathname, completed_dependencies);
  });
  return true;
}

function create_before_navigation_guard_dependencies(
  is_app_ready: () => boolean,
): BeforeNavigationGuardDependencies {
  return {
    is_app_ready,
    read_current_role,
    evaluate_cached_route_access,
    evaluate_local_route_access: is_route_allowed_for_role_locally,
    record_denial: record_navigation_denial,
  };
}

function create_completed_navigation_guard_dependencies(
  is_app_ready: () => boolean,
): CompletedNavigationGuardDependencies {
  return { is_app_ready, ensure_route_access };
}

function guard_root_layout_initial_route(pathname: string): Promise<boolean> {
  return guard_completed_navigation(
    create_completed_navigation_guard_dependencies(() => true),
    pathname,
  );
}

export function reveal_root_layout_after_initial_route(
  pathname: string,
  reveal_page: () => boolean,
): Promise<boolean> {
  return reveal_page_after_initial_route_decision(
    { guard_initial_route: guard_root_layout_initial_route, reveal_page },
    pathname,
  );
}
