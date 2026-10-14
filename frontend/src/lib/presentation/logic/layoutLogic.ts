import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import {
  APP_ROUTE_PATH,
  ROUTE_GUARD_EXEMPT_EXACT_PATHS,
} from "./layoutRouteConstants";

export const SESSION_ACTION = {
  LOGIN_SYNC: "login_sync",
  VERIFIED_PAGE_RELOAD: "verified_page_reload",
  FIRST_TIME_ANONYMOUS: "first_time_anonymous",
  RETURNING_ANONYMOUS: "returning_anonymous",
} as const;

export type SessionAction =
  (typeof SESSION_ACTION)[keyof typeof SESSION_ACTION];

export function get_is_public_profile_page(path: string): boolean {
  return (
    path.startsWith(APP_ROUTE_PATH.PLAYER_PROFILE_PREFIX) ||
    path.startsWith(APP_ROUTE_PATH.TEAM_PROFILE_PREFIX)
  );
}

export function get_is_public_content_page(path: string): boolean {
  return (
    path.startsWith(APP_ROUTE_PATH.COMPETITION_RESULTS) ||
    path.startsWith(APP_ROUTE_PATH.CALENDAR) ||
    path.startsWith(APP_ROUTE_PATH.MATCH_REPORT)
  );
}

export function get_is_auth_page(path: string): boolean {
  return (
    path.startsWith(APP_ROUTE_PATH.SIGN_IN) ||
    path === APP_ROUTE_PATH.UNAUTHORIZED
  );
}

export function is_route_guard_exempt(path: string): boolean {
  return (
    ROUTE_GUARD_EXEMPT_EXACT_PATHS.has(path) ||
    path.startsWith(APP_ROUTE_PATH.SIGN_IN) ||
    path.startsWith(APP_ROUTE_PATH.API_PREFIX) ||
    get_is_public_content_page(path) ||
    get_is_public_profile_page(path)
  );
}

export function determine_session_action(
  user_is_signed_in: boolean,
  session_already_synced: boolean,
): SessionAction {
  if (user_is_signed_in && !session_already_synced)
    return SESSION_ACTION.LOGIN_SYNC;
  if (user_is_signed_in && session_already_synced)
    return SESSION_ACTION.VERIFIED_PAGE_RELOAD;
  if (!user_is_signed_in && !session_already_synced)
    return SESSION_ACTION.FIRST_TIME_ANONYMOUS;
  return SESSION_ACTION.RETURNING_ANONYMOUS;
}

const SYNC_PROGRESS_BASE_PERCENT = 20;
const SYNC_PROGRESS_SPAN_PERCENT = 68;

export function format_table_name(table_name: string): string {
  return table_name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function scale_sync_percentage(raw_percentage: number): number {
  return (
    SYNC_PROGRESS_BASE_PERCENT +
    Math.round((raw_percentage / 100) * SYNC_PROGRESS_SPAN_PERCENT)
  );
}

export function build_sync_progress_message(
  table_name: string,
  tables_completed: number,
  total_tables: number,
): string {
  const table_display = format_table_name(table_name);
  return `Syncing ${table_display} (${tables_completed}/${total_tables})`;
}

export function should_pull_org_from_server(organization_id: string): boolean {
  const normalized_organization_id = organization_id.trim();

  return (
    normalized_organization_id.length > 0 &&
    normalized_organization_id !== WILDCARD_SCOPE
  );
}
