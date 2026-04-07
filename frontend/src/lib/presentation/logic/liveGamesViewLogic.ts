import type { Fixture } from "$lib/core/entities/Fixture";

export function format_live_game_date_time(date_time: string): string {
  return new Date(date_time).toLocaleString();
}

export function get_live_game_status_badge_class(status: string): string {
  const base_classes =
    "px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide whitespace-nowrap";

  switch (status) {
    case "scheduled":
      return (
        base_classes +
        " bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
      );
    case "in_progress":
      return (
        base_classes +
        " bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
      );
    case "postponed":
      return (
        base_classes +
        " bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
      );
    default:
      return (
        base_classes +
        " bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-200"
      );
  }
}

export function get_live_game_check_icon(status: string): string {
  switch (status) {
    case "passed":
      return "✓";
    case "failed":
      return "✗";
    case "checking":
      return "◌";
    default:
      return "○";
  }
}

export function get_live_game_check_class(status: string): string {
  switch (status) {
    case "passed":
      return "text-emerald-600 dark:text-emerald-400";
    case "failed":
      return "text-red-600 dark:text-red-400";
    case "checking":
      return "text-blue-600 dark:text-blue-400 animate-pulse";
    default:
      return "text-accent-400 dark:text-accent-500";
  }
}

export function get_live_game_check_container_class(status: string): string {
  switch (status) {
    case "failed":
      return "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3";
    default:
      return "py-1";
  }
}

export function get_live_game_matchup_label(
  fixture: Fixture,
  team_names: Record<string, string>,
): string {
  const home_team_name =
    team_names[fixture.home_team_id] || fixture.home_team_name || "Home Team";
  const away_team_name =
    team_names[fixture.away_team_id] || fixture.away_team_name || "Away Team";
  return `${home_team_name} vs ${away_team_name}`;
}
