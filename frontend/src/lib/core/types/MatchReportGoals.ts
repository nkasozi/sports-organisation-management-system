import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import {
  humanize_event_code,
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
  type ScoreAwardResolver,
} from "$lib/core/entities/SportEventCatalog";
import type { ScoreCreditedSide } from "$lib/core/entities/SportEventCatalogConstants";

import {
  MATCH_REPORT_GOAL_ACTION_LABELS,
  MATCH_REPORT_TEAM_SIDE,
  MATCH_REPORT_UNKNOWN_JERSEY,
} from "./MatchReportConstants";
import type { MatchGoalEntry } from "./MatchReportTypes";

type CreditedScore = {
  event: GameEvent;
  is_home_credited: boolean;
  points: number;
};

function is_home_credited(
  event: GameEvent,
  credited_side: ScoreCreditedSide,
): boolean {
  const is_home_side = event.team_side === MATCH_REPORT_TEAM_SIDE.HOME;
  switch (credited_side) {
    case SCORE_CREDITED_SIDE.ACTING:
      return is_home_side;
    case SCORE_CREDITED_SIDE.OPPOSING:
      return event.team_side === MATCH_REPORT_TEAM_SIDE.AWAY;
  }
}

function to_credited_score(
  event: GameEvent,
  resolve_score: ScoreAwardResolver,
): CreditedScore[] {
  const award = resolve_score(event.event_type);
  switch (award.kind) {
    case SCORE_AWARD_KIND.NONE:
      return [];
    case SCORE_AWARD_KIND.CREDIT:
      return [
        {
          event,
          is_home_credited: is_home_credited(event, award.credited_side),
          points: award.points,
        },
      ];
  }
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
  resolve_score: ScoreAwardResolver,
): MatchGoalEntry[] {
  const context: GoalExtractionContext = {
    home_initials,
    away_initials,
    home_players,
    away_players,
  };
  const score = { home: 0, away: 0 };
  return [...game_events]
    .sort((a, b) => a.minute - b.minute)
    .flatMap((event) => to_credited_score(event, resolve_score))
    .map((credited) => build_goal_entry(credited, context, score));
}

function build_goal_entry(
  credited: CreditedScore,
  context: GoalExtractionContext,
  score: { home: number; away: number },
): MatchGoalEntry {
  const { event } = credited;
  const is_home_scoring = credited.is_home_credited;
  score.home += is_home_scoring ? credited.points : 0;
  score.away += is_home_scoring ? 0 : credited.points;
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

function abbreviate_event_code(event_type: string): string {
  return humanize_event_code(event_type)
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function get_goal_action_label(event_type: string): string {
  return (
    MATCH_REPORT_GOAL_ACTION_LABELS[event_type] ??
    abbreviate_event_code(event_type)
  );
}
