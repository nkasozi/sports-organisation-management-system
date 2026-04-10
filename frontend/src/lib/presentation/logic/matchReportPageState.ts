import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";

const MATCH_REPORT_STATUS_COLOR_BY_VALUE: Record<string, string> = {
  in_progress: "text-green-400",
  completed: "text-gray-400",
  scheduled: "text-primary-400",
};

const MATCH_REPORT_STATUS_LABEL_BY_VALUE: Record<string, string> = {
  completed: "Full Time",
  in_progress: "LIVE",
  scheduled: "Upcoming",
};

const MATCH_REPORT_EVENT_BACKGROUND_BY_TYPE: Record<string, string> = {
  goal: "border-l-green-500 bg-green-50 dark:bg-green-900/20",
  penalty_scored: "border-l-green-500 bg-green-50 dark:bg-green-900/20",
  own_goal: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
  yellow_card: "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  red_card: "border-l-red-500 bg-red-50 dark:bg-red-900/20",
  second_yellow: "border-l-red-500 bg-red-50 dark:bg-red-900/20",
  substitution: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
  period_start: "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20",
  period_end: "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20",
};

const MATCH_REPORT_DEFAULT_TEXT = {
  kickoff_time_tbd: "TBD",
  default_event_background: "border-l-gray-300 bg-gray-50 dark:bg-accent-800",
} as const;

interface MatchReportLineupGroups {
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface MatchReportViewState {
  home_score: number;
  away_score: number;
  sorted_events: GameEvent[];
  home_starters: LineupPlayer[];
  home_substitutes: LineupPlayer[];
  away_starters: LineupPlayer[];
  away_substitutes: LineupPlayer[];
  is_game_scheduled: boolean;
  is_game_in_progress: boolean;
  is_game_completed: boolean;
  has_lineups: boolean;
}

function sort_match_report_events(game_events: GameEvent[]): GameEvent[] {
  return [...game_events].sort(
    (first_event: GameEvent, second_event: GameEvent) =>
      first_event.minute - second_event.minute ||
      new Date(first_event.recorded_at).getTime() -
        new Date(second_event.recorded_at).getTime(),
  );
}

export function build_match_report_lineup_groups(
  players: LineupPlayer[],
): MatchReportLineupGroups {
  return {
    starters: players.filter(
      (current_player: LineupPlayer) => !current_player.is_substitute,
    ),
    substitutes: players.filter(
      (current_player: LineupPlayer) => current_player.is_substitute,
    ),
  };
}

export function build_match_report_view_state(command: {
  fixture: Fixture | null;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
}): MatchReportViewState {
  const home_lineup_groups = build_match_report_lineup_groups(
    command.home_players,
  );
  const away_lineup_groups = build_match_report_lineup_groups(
    command.away_players,
  );

  return {
    home_score: command.fixture?.home_team_score ?? 0,
    away_score: command.fixture?.away_team_score ?? 0,
    sorted_events: sort_match_report_events(command.fixture?.game_events ?? []),
    home_starters: home_lineup_groups.starters,
    home_substitutes: home_lineup_groups.substitutes,
    away_starters: away_lineup_groups.starters,
    away_substitutes: away_lineup_groups.substitutes,
    is_game_scheduled: command.fixture?.status === "scheduled",
    is_game_in_progress: command.fixture?.status === "in_progress",
    is_game_completed: command.fixture?.status === "completed",
    has_lineups:
      command.home_players.length > 0 || command.away_players.length > 0,
  };
}

export function get_match_report_event_bg_class(event: GameEvent): string {
  return (
    MATCH_REPORT_EVENT_BACKGROUND_BY_TYPE[event.event_type] ||
    MATCH_REPORT_DEFAULT_TEXT.default_event_background
  );
}

export function get_match_report_status_color(status: string): string {
  return (
    MATCH_REPORT_STATUS_COLOR_BY_VALUE[status] ||
    MATCH_REPORT_STATUS_COLOR_BY_VALUE.scheduled
  );
}

export function get_match_report_status_label(status: string): string {
  return MATCH_REPORT_STATUS_LABEL_BY_VALUE[status] || status;
}

export function should_poll_match_report_fixture(
  fixture: Fixture | null,
): boolean {
  return fixture?.status === "scheduled" || fixture?.status === "in_progress";
}

export function build_match_report_page_title(
  fixture: Fixture | null,
  home_team_name: string | null,
  away_team_name: string | null,
): string {
  if (!fixture) {
    return "Match Viewer";
  }

  return `${home_team_name || "Home"} vs ${away_team_name || "Away"} - Match Viewer`;
}

export function format_match_report_kickoff_display(
  date: string,
  time: string,
): string {
  if (!date) {
    return time || MATCH_REPORT_DEFAULT_TEXT.kickoff_time_tbd;
  }

  const parsed_date = new Date(`${date}T00:00:00`);
  const formatted_date = Number.isNaN(parsed_date.getTime())
    ? date
    : parsed_date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  if (!time) {
    return formatted_date;
  }

  return `${formatted_date} · ${time}`;
}
