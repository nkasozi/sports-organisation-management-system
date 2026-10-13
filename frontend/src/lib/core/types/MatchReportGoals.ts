import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";

import {
  MATCH_REPORT_FIELD_GOAL_LABEL,
  MATCH_REPORT_GOAL_ACTION_LABELS,
  MATCH_REPORT_GOAL_EVENT,
  MATCH_REPORT_GOAL_EVENT_TYPES,
  MATCH_REPORT_TEAM_SIDE,
  MATCH_REPORT_UNKNOWN_JERSEY,
} from "./MatchReportConstants";
import type { MatchGoalEntry } from "./MatchReportTypes";

function is_home_scoring_event(event: GameEvent): boolean {
  const is_own_goal = event.event_type === MATCH_REPORT_GOAL_EVENT.OWN_GOAL;
  const is_home_side = event.team_side === MATCH_REPORT_TEAM_SIDE.HOME;
  const is_away_side = event.team_side === MATCH_REPORT_TEAM_SIDE.AWAY;
  return is_own_goal ? is_away_side : is_home_side;
}

interface GoalExtractionContext {
  home_initials: string;
  away_initials: string;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
}

export function extract_goals_from_events(
  game_events: GameEvent[],
  home_initials: string,
  away_initials: string,
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
): MatchGoalEntry[] {
  const context: GoalExtractionContext = {
    home_initials,
    away_initials,
    home_players,
    away_players,
  };
  const score = { home: 0, away: 0 };
  return game_events
    .filter((e) => MATCH_REPORT_GOAL_EVENT_TYPES.includes(e.event_type))
    .sort((a, b) => a.minute - b.minute)
    .map((event) => build_goal_entry(event, context, score));
}

function build_goal_entry(
  event: GameEvent,
  context: GoalExtractionContext,
  score: { home: number; away: number },
): MatchGoalEntry {
  const is_home_scoring = is_home_scoring_event(event);
  score.home += is_home_scoring ? 1 : 0;
  score.away += is_home_scoring ? 0 : 1;
  return {
    team_initials: is_home_scoring
      ? context.home_initials
      : context.away_initials,
    minute: event.minute,
    jersey_number: find_player_jersey_number(
      event.player_name,
      event.team_side,
      context.home_players,
      context.away_players,
    ),
    action: get_goal_action_label(event.event_type),
    score: `${score.home}-${score.away}`,
  };
}

function is_matching_player_name(
  full_name: string,
  name_upper: string,
): boolean {
  return (
    full_name === name_upper ||
    full_name.includes(name_upper) ||
    name_upper.includes(full_name)
  );
}

function find_player_jersey_number(
  player_name: string,
  team_side: GameEvent["team_side"],
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
): number | string {
  const name_upper = player_name.toUpperCase().trim();
  if (name_upper.length === 0) return MATCH_REPORT_UNKNOWN_JERSEY;
  const players =
    team_side === MATCH_REPORT_TEAM_SIDE.HOME ? home_players : away_players;
  const matching_player = players.find((player) =>
    is_matching_player_name(
      `${player.first_name} ${player.last_name}`.toUpperCase().trim(),
      name_upper,
    ),
  );
  if (!matching_player) return MATCH_REPORT_UNKNOWN_JERSEY;
  return matching_player.jersey_number ?? MATCH_REPORT_UNKNOWN_JERSEY;
}

function get_goal_action_label(event_type: string): string {
  return (
    MATCH_REPORT_GOAL_ACTION_LABELS[event_type] ?? MATCH_REPORT_FIELD_GOAL_LABEL
  );
}
