import type { Fixture } from "$lib/core/entities/Fixture";
import { resolve_event_score_award } from "$lib/core/entities/GameEventStoredFacts";
import {
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
  type ScoreAwardResolver,
} from "$lib/core/entities/SportEventCatalog";
import type { Team } from "$lib/core/entities/Team";

import type { CardStatCategory } from "./competitionResultsCardStats";
import {
  build_moment_context,
  find_acting_team_id,
  type PeriodInfo,
  PLAYER_STAT_MOMENT_KIND,
  type PlayerStatMoment,
} from "./competitionResultsPlayerMoments";
import { apply_unscored_event } from "./competitionResultsStatsEvents";

export {
  PLAYER_STAT_MOMENT_KIND,
  type PlayerStatMoment,
} from "./competitionResultsPlayerMoments";

const ALL_TEAMS_FILTER = "all";
const UNKNOWN_TEAM_NAME = "Unknown";
const STATS_LEADERBOARD_SIZE = 10;
const PLAYER_KEY_SEPARATOR = "|";

export interface PlayerStats {
  player_key: string;
  player_name: string;
  team_name: string;
  points: number;
  assists: number;
  card_counts: Record<string, number>;
  moments: PlayerStatMoment[];
}

type FixtureGameEvent = NonNullable<Fixture["game_events"]>[number];

interface PlayerStatsRules {
  resolve_score: ScoreAwardResolver;
  card_categories: readonly CardStatCategory[];
  periods: ReadonlyMap<string, PeriodInfo>;
}

function build_player_key(
  game_event: FixtureGameEvent,
  team_id: string,
): string {
  return game_event.player_id
    ? game_event.player_id
    : `${game_event.player_name}${PLAYER_KEY_SEPARATOR}${team_id}`;
}

function get_or_create_player_stats(
  stats_map: Map<string, PlayerStats>,
  fixture: Fixture,
  game_event: FixtureGameEvent,
  team_map: Map<string, Team>,
): PlayerStats {
  const team_id = find_acting_team_id(fixture, game_event.team_side);
  const player_key = build_player_key(game_event, team_id);
  const existing_player_stats = stats_map.get(player_key);
  if (existing_player_stats) return existing_player_stats;
  const created_player_stats: PlayerStats = {
    player_key,
    player_name: game_event.player_name,
    team_name: team_map.get(team_id)?.name ?? UNKNOWN_TEAM_NAME,
    points: 0,
    assists: 0,
    card_counts: {},
    moments: [],
  };
  stats_map.set(player_key, created_player_stats);
  return created_player_stats;
}

function apply_game_event_to_player_stats(
  player_stats: PlayerStats,
  fixture: Fixture,
  game_event: FixtureGameEvent,
  rules: PlayerStatsRules,
): PlayerStats {
  const context = build_moment_context(fixture, game_event, rules.periods);
  const award = resolve_event_score_award(game_event, rules.resolve_score);
  switch (award.kind) {
    case SCORE_AWARD_KIND.NONE:
      return apply_unscored_event(
        player_stats,
        game_event,
        context,
        rules.card_categories,
      );
    case SCORE_AWARD_KIND.CREDIT:
      if (award.credited_side !== SCORE_CREDITED_SIDE.ACTING)
        return player_stats;
      player_stats.points += award.points;
      player_stats.moments.push({
        ...context,
        kind: PLAYER_STAT_MOMENT_KIND.SCORE,
        points: award.points,
      });
      return player_stats;
  }
}

export function calculate_player_stats(
  fixtures: Fixture[],
  team_map: Map<string, Team>,
  resolve_score: ScoreAwardResolver,
  card_categories: readonly CardStatCategory[],
  periods: ReadonlyMap<string, PeriodInfo>,
): PlayerStats[] {
  const rules: PlayerStatsRules = {
    resolve_score,
    card_categories,
    periods,
  };
  const stats_map = new Map<string, PlayerStats>();

  for (const fixture of fixtures) {
    for (const game_event of fixture.game_events ?? []) {
      if (!game_event.player_name) continue;
      apply_game_event_to_player_stats(
        get_or_create_player_stats(stats_map, fixture, game_event, team_map),
        fixture,
        game_event,
        rules,
      );
    }
  }

  return [...stats_map.values()].sort(
    (left: PlayerStats, right: PlayerStats) => right.points - left.points,
  );
}

export function derive_stats_available_teams(stats: PlayerStats[]): string[] {
  return [
    ...new Set(
      stats.map((player_stats: PlayerStats) => player_stats.team_name),
    ),
  ].sort();
}

function filter_leaderboard(
  stats: PlayerStats[],
  team_filter: string,
  read_value: (player_stats: PlayerStats) => number,
): PlayerStats[] {
  return stats
    .filter((player_stats: PlayerStats) => read_value(player_stats) > 0)
    .filter(
      (player_stats: PlayerStats) =>
        team_filter === ALL_TEAMS_FILTER ||
        player_stats.team_name === team_filter,
    )
    .sort(
      (left: PlayerStats, right: PlayerStats) =>
        read_value(right) - read_value(left),
    )
    .slice(0, STATS_LEADERBOARD_SIZE);
}

export function filter_and_sort_scorers(
  stats: PlayerStats[],
  team_filter: string,
): PlayerStats[] {
  return filter_leaderboard(stats, team_filter, (player) => player.points);
}

export function filter_and_sort_assisters(
  stats: PlayerStats[],
  team_filter: string,
): PlayerStats[] {
  return filter_leaderboard(stats, team_filter, (player) => player.assists);
}
