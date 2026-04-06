import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
export type SessionAction =
  | "login_sync"
  | "verified_page_reload"
  | "first_time_anonymous"
  | "returning_anonymous";

export type NavigationType = "link" | "goto" | "popstate" | "enter" | string;

export function get_is_public_profile_page(path: string): boolean {
  return path.startsWith("/profile/") || path.startsWith("/team-profile/");
}

export function get_is_public_content_page(path: string): boolean {
  return (
    path.startsWith("/competition-results") ||
    path.startsWith("/calendar") ||
    path.startsWith("/match-report")
  );
}

export function get_is_auth_page(path: string): boolean {
  return path.startsWith("/sign-in") || path === "/unauthorized";
}

export function is_route_guard_exempt(path: string): boolean {
  return (
    path === "/" ||
    path.startsWith("/sign-in") ||
    path === "/unauthorized" ||
    path.startsWith("/api/") ||
    path === "/privacy" ||
    path === "/terms" ||
    path === "/contact" ||
    get_is_public_content_page(path)
  );
}

export function determine_session_action(
  user_is_signed_in: boolean,
  session_already_synced: boolean,
): SessionAction {
  if (user_is_signed_in && !session_already_synced) return "login_sync";
  if (user_is_signed_in && session_already_synced)
    return "verified_page_reload";
  if (!user_is_signed_in && !session_already_synced)
    return "first_time_anonymous";
  return "returning_anonymous";
}

export function is_in_app_navigation(navigation_type: NavigationType): boolean {
  return (
    navigation_type === "link" ||
    navigation_type === "goto" ||
    navigation_type === "popstate"
  );
}

export function format_table_name(table_name: string): string {
  return table_name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function scale_sync_percentage(raw_percentage: number): number {
  return 20 + Math.round((raw_percentage / 100) * 68);
}

export function build_sync_progress_message(
  table_name: string,
  tables_completed: number,
  total_tables: number,
): string {
  const table_display = format_table_name(table_name);
  return `Syncing ${table_display} (${tables_completed}/${total_tables})`;
}

export function should_pull_org_from_server(
  organization_id: string | undefined | null,
): boolean {
  return !!organization_id && organization_id !== WILDCARD_SCOPE;
}
