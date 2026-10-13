import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";

import {
  MATCH_REPORT_DEFAULT_TEXT,
  MATCH_REPORT_EVENT_BACKGROUND_BY_TYPE,
  MATCH_REPORT_STATUS_COLOR_BY_VALUE,
  MATCH_REPORT_STATUS_LABEL_BY_VALUE,
} from "./matchReportPageDisplayConstants";
import type { MatchReportPageDataState } from "./matchReportPageLoadTypes";
import { PRESENCE_STATUS } from "./presenceStatus";

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

function create_empty_match_report_view_state(): MatchReportViewState {
  return {
    home_score: 0,
    away_score: 0,
    sorted_events: [],
    home_starters: [],
    home_substitutes: [],
    away_starters: [],
    away_substitutes: [],
    is_game_scheduled: false,
    is_game_in_progress: false,
    is_game_completed: false,
    has_lineups: false,
  };
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
  page_data_state: MatchReportPageDataState;
}): MatchReportViewState {
  if (command.page_data_state.status === PRESENCE_STATUS.MISSING) {
    return create_empty_match_report_view_state();
  }

  const page_data = command.page_data_state.page_data;
  const home_lineup_groups = build_match_report_lineup_groups(
    page_data.home_players,
  );
  const away_lineup_groups = build_match_report_lineup_groups(
    page_data.away_players,
  );

  return {
    home_score: page_data.fixture.home_team_score ?? 0,
    away_score: page_data.fixture.away_team_score ?? 0,
    sorted_events: sort_match_report_events(
      page_data.fixture.game_events ?? [],
    ),
    home_starters: home_lineup_groups.starters,
    home_substitutes: home_lineup_groups.substitutes,
    away_starters: away_lineup_groups.starters,
    away_substitutes: away_lineup_groups.substitutes,
    is_game_scheduled: page_data.fixture.status === FIXTURE_STATUS.SCHEDULED,
    is_game_in_progress:
      page_data.fixture.status === FIXTURE_STATUS.IN_PROGRESS,
    is_game_completed: page_data.fixture.status === FIXTURE_STATUS.COMPLETED,
    has_lineups:
      page_data.home_players.length > 0 || page_data.away_players.length > 0,
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
  page_data_state: MatchReportPageDataState,
): boolean {
  if (page_data_state.status === PRESENCE_STATUS.MISSING) {
    return false;
  }

  return (
    page_data_state.page_data.fixture.status === FIXTURE_STATUS.SCHEDULED ||
    page_data_state.page_data.fixture.status === FIXTURE_STATUS.IN_PROGRESS
  );
}

export function build_match_report_page_title(
  page_data_state: MatchReportPageDataState,
): string {
  if (page_data_state.status === PRESENCE_STATUS.MISSING) {
    return MATCH_REPORT_DEFAULT_TEXT.page_title_suffix;
  }

  const home_team_name =
    page_data_state.page_data.home_team_state.status === PRESENCE_STATUS.PRESENT
      ? page_data_state.page_data.home_team_state.team.name
      : MATCH_REPORT_DEFAULT_TEXT.home_team_fallback;
  const away_team_name =
    page_data_state.page_data.away_team_state.status === PRESENCE_STATUS.PRESENT
      ? page_data_state.page_data.away_team_state.team.name
      : MATCH_REPORT_DEFAULT_TEXT.away_team_fallback;

  return `${home_team_name} vs ${away_team_name} - ${MATCH_REPORT_DEFAULT_TEXT.page_title_suffix}`;
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
    : parsed_date.toLocaleDateString(
        MATCH_REPORT_DEFAULT_TEXT.kickoff_date_locale,
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      );

  if (!time) {
    return formatted_date;
  }

  return `${formatted_date} · ${time}`;
}
