import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import { get_time_on_display } from "$lib/core/entities/FixtureLineup";

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
  final_score: {
    home: number;
    away: number;
  };
  score_by_period: MatchScoreByPeriod[];
  home_players: MatchPlayerEntry[];
  away_players: MatchPlayerEntry[];
  officials: MatchOfficialInfo[];
  goals: MatchGoalEntry[];
  remarks: string;
  venue_name: string;
  card_types: CardTypeConfig[];
}

export function build_match_player_entry(
  player: LineupPlayer,
  game_events: GameEvent[],
  team_side: "home" | "away",
  card_types: CardTypeConfig[],
): MatchPlayerEntry {
  const player_full_name =
    `${player.first_name} ${player.last_name}`.toUpperCase();
  const cards: MatchPlayerCard[] = [];

  const card_event_types = card_types.map((ct) => ct.event_type);

  const relevant_events = game_events.filter(
    (e) =>
      e.team_side === team_side &&
      e.player_name.toUpperCase() === player_full_name &&
      card_event_types.includes(e.event_type),
  );

  for (const event of relevant_events) {
    const card_config = card_types.find(
      (ct) => ct.event_type === event.event_type,
    );
    if (card_config) {
      cards.push({ minute: `${event.minute}'`, card_type: card_config.id });
    }
  }

  let time_on = get_time_on_display(player.time_on);
  if (!time_on && !player.is_substitute) {
    time_on = "X";
  }
  if (time_on && time_on !== "X" && time_on !== "") {
    time_on = `${time_on}'`;
  }

  return {
    time_on,
    jersey_number: player.jersey_number ?? "?",
    name: player_full_name,
    cards,
  };
}

export function extract_goals_from_events(
  game_events: GameEvent[],
  home_initials: string,
  away_initials: string,
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
): MatchGoalEntry[] {
  const goal_event_types = ["goal", "own_goal", "penalty_scored"];
  let running_home_score = 0;
  let running_away_score = 0;

  const goal_events = game_events
    .filter((e) => goal_event_types.includes(e.event_type))
    .sort((a, b) => a.minute - b.minute);

  const goals: MatchGoalEntry[] = [];

  for (const event of goal_events) {
    const is_home_goal =
      event.team_side === "home" && event.event_type !== "own_goal";
    const is_away_own_goal =
      event.team_side === "away" && event.event_type === "own_goal";
    const is_home_scoring = is_home_goal || is_away_own_goal;

    if (is_home_scoring) {
      running_home_score++;
    } else {
      running_away_score++;
    }

    const action = get_goal_action_label(event.event_type);
    const team_initials = is_home_scoring ? home_initials : away_initials;
    const jersey_number = find_player_jersey_number(
      event.player_name,
      event.team_side,
      home_players,
      away_players,
    );

    goals.push({
      team_initials,
      minute: event.minute,
      jersey_number,
      action,
      score: `${running_home_score}-${running_away_score}`,
    });
  }

  return goals;
}

function find_player_jersey_number(
  player_name: string,
  team_side: "home" | "away" | "match",
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
): number | string {
  if (!player_name || player_name.trim() === "") {
    return "?";
  }

  const players = team_side === "home" ? home_players : away_players;
  const name_upper = player_name.toUpperCase().trim();

  for (const player of players) {
    const full_name = `${player.first_name} ${player.last_name}`
      .toUpperCase()
      .trim();
    if (full_name === name_upper) {
      return player.jersey_number ?? "?";
    }
  }

  for (const player of players) {
    const full_name = `${player.first_name} ${player.last_name}`.toUpperCase();
    if (full_name.includes(name_upper) || name_upper.includes(full_name)) {
      return player.jersey_number ?? "?";
    }
  }

  return "?";
}

function get_goal_action_label(event_type: string): string {
  switch (event_type) {
    case "goal":
      return "FG";
    case "penalty_scored":
      return "PC";
    case "own_goal":
      return "OG";
    default:
      return "FG";
  }
}

export function format_report_date(date_string: string): string {
  const date = new Date(date_string);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function get_team_initials(team_name: string): string {
  const words = team_name.trim().split(/\s+/);
  if (words.length === 1 && words[0].length <= 3) {
    return words[0].toUpperCase();
  }
  return words
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 3);
}
