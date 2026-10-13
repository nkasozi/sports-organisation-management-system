import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import { get_time_on_display } from "$lib/core/entities/FixtureLineup";

import {
  MATCH_REPORT_EMPTY_TIME_ON,
  MATCH_REPORT_PRESENT_AT_START_MARK,
  MATCH_REPORT_TEAM_SIDE,
  MATCH_REPORT_UNKNOWN_JERSEY,
} from "./MatchReportConstants";

export { extract_goals_from_events } from "./MatchReportGoals";

type MatchReportTeamSide =
  (typeof MATCH_REPORT_TEAM_SIDE)[keyof typeof MATCH_REPORT_TEAM_SIDE];

export interface MatchStaffEntry {
  role: string;
  name: string;
}
export interface CardTypeConfig {
  id: string;
  name: string;
  color: string;
  event_type: string;
}
export interface MatchTeamInfo {
  name: string;
  initials: string;
  jersey_color: string;
  staff: MatchStaffEntry[];
}
export interface MatchOfficialInfo {
  role: string;
  name: string;
}
export interface MatchScoreByPeriod {
  period_name: string;
  home_score: number;
  away_score: number;
}
export interface MatchPlayerCard {
  minute: string;
  card_type: string;
}
export interface MatchPlayerEntry {
  time_on: string;
  jersey_number: number | string;
  name: string;
  cards: MatchPlayerCard[];
}
export interface MatchGoalEntry {
  team_initials: string;
  minute: number;
  jersey_number: number | string;
  action: string;
  score: string;
}
export interface MatchReportData {
  league_name: string;
  organization_logo_url: string;
  competition_name: string;
  fixture_year: string;
  report_title: string;
  date: string;
  game_week: number;
  pool: string;
  match_number: number;
  scheduled_push_back: string;
  push_back_time: string;
  home_team: MatchTeamInfo;
  away_team: MatchTeamInfo;
  final_score: { home: number; away: number };
  score_by_period: MatchScoreByPeriod[];
  home_players: MatchPlayerEntry[];
  away_players: MatchPlayerEntry[];
  officials: MatchOfficialInfo[];
  goals: MatchGoalEntry[];
  remarks: string;
  venue_name: string;
  card_types: CardTypeConfig[];
}

function resolve_report_time_on(player: LineupPlayer): string {
  const display = get_time_on_display(player.time_on);
  if (!display) {
    return player.is_substitute
      ? MATCH_REPORT_EMPTY_TIME_ON
      : MATCH_REPORT_PRESENT_AT_START_MARK;
  }
  if (display === MATCH_REPORT_PRESENT_AT_START_MARK) return display;
  return `${display}'`;
}

function collect_player_cards(
  player_full_name: string,
  game_events: GameEvent[],
  team_side: MatchReportTeamSide,
  card_types: CardTypeConfig[],
): MatchPlayerCard[] {
  const cards: MatchPlayerCard[] = [];
  for (const event of game_events) {
    const card_config = card_types.find(
      (ct) => ct.event_type === event.event_type,
    );
    const is_player_card =
      event.team_side === team_side &&
      event.player_name.toUpperCase() === player_full_name;
    if (card_config && is_player_card) {
      cards.push({ minute: `${event.minute}'`, card_type: card_config.id });
    }
  }
  return cards;
}

export function build_match_player_entry(
  player: LineupPlayer,
  game_events: GameEvent[],
  team_side: MatchReportTeamSide,
  card_types: CardTypeConfig[],
): MatchPlayerEntry {
  const player_full_name =
    `${player.first_name} ${player.last_name}`.toUpperCase();
  return {
    time_on: resolve_report_time_on(player),
    jersey_number: player.jersey_number ?? MATCH_REPORT_UNKNOWN_JERSEY,
    name: player_full_name,
    cards: collect_player_cards(
      player_full_name,
      game_events,
      team_side,
      card_types,
    ),
  };
}

export function format_report_date(date_string: string): string {
  const date = new Date(date_string);
  return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" }).toUpperCase()} ${date.getFullYear()}`;
}

export function get_team_initials(team_name: string): string {
  const words = team_name.trim().split(/\s+/);
  if (words.length === 1 && words[0].length <= 3) return words[0].toUpperCase();
  return words
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 3);
}
