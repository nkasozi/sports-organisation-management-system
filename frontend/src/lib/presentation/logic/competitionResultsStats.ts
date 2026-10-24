import type { Fixture } from "$lib/core/entities/Fixture";
import { resolve_event_score_award } from "$lib/core/entities/GameEventStoredFacts";
import {
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
  type ScoreAwardResolver,
} from "$lib/core/entities/SportEventCatalog";
import type { Team } from "$lib/core/entities/Team";
import { OptionStatus } from "$lib/core/types/Option";
import { TEAM_SIDE } from "$lib/presentation/logic/gameEventConstants";

import {
  type CardStatCategory,
  count_player_card_type,
  resolve_card_type_for_event,
} from "./competitionResultsCardStats";

const ALL_TEAMS_FILTER = "all";
const UNKNOWN_TEAM_NAME = "Unknown";
const STATS_LEADERBOARD_SIZE = 10;
const SINGLE_CARD = 1;

export interface PlayerStats {
  player_name: string;
  team_name: string;
  points: number;
  assists: number;
  card_counts: Record<string, number>;
}

type FixtureGameEvent = NonNullable<Fixture["game_events"]>[number];

function get_or_create_player_stats(
  stats_map: Map<string, PlayerStats>,
  fixture: Fixture,
  game_event: FixtureGameEvent,
  team_map: Map<string, Team>,
): PlayerStats {
  const player_key = `${game_event.player_name}-${game_event.team_side}`;
  const existing_player_stats = stats_map.get(player_key);
  if (existing_player_stats) return existing_player_stats;
  const team =
    game_event.team_side === TEAM_SIDE.HOME
      ? team_map.get(fixture.home_team_id)
      : team_map.get(fixture.away_team_id);
  const created_player_stats: PlayerStats = {
    player_name: game_event.player_name,
    team_name: team?.name ?? UNKNOWN_TEAM_NAME,
    points: 0,
    assists: 0,
    card_counts: {},
  };
  stats_map.set(player_key, created_player_stats);
  return created_player_stats;
}

function apply_card_to_player_stats(
  player_stats: PlayerStats,
  game_event: FixtureGameEvent,
  card_categories: readonly CardStatCategory[],
): PlayerStats {
  const card_type = resolve_card_type_for_event(
    card_categories,
    game_event.event_type,
  );
  if (card_type.status === OptionStatus.NONE) return player_stats;
  player_stats.card_counts[card_type.value] =
    count_player_card_type(player_stats, card_type.value) + SINGLE_CARD;
  return player_stats;
}

interface PlayerStatsRules {
  resolve_score: ScoreAwardResolver;
  card_categories: readonly CardStatCategory[];
}

function apply_game_event_to_player_stats(
  player_stats: PlayerStats,
  game_event: FixtureGameEvent,
  rules: PlayerStatsRules,
): PlayerStats {
  const award = resolve_event_score_award(game_event, rules.resolve_score);
  switch (award.kind) {
    case SCORE_AWARD_KIND.NONE:
      return apply_card_to_player_stats(
        player_stats,
        game_event,
        rules.card_categories,
      );
    case SCORE_AWARD_KIND.CREDIT:
      if (award.credited_side === SCORE_CREDITED_SIDE.ACTING)
        player_stats.points += award.points;
      return player_stats;
  }
}

export function calculate_player_stats(
  fixtures: Fixture[],
  team_map: Map<string, Team>,
  resolve_score: ScoreAwardResolver,
  card_categories: readonly CardStatCategory[],
): PlayerStats[] {
  const rules: PlayerStatsRules = { resolve_score, card_categories };
  const stats_map = new Map<string, PlayerStats>();

  for (const fixture of fixtures) {
    for (const game_event of fixture.game_events ?? []) {
      if (!game_event.player_name) continue;
      apply_game_event_to_player_stats(
        get_or_create_player_stats(stats_map, fixture, game_event, team_map),
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

export function filter_and_sort_scorers(
  stats: PlayerStats[],
  team_filter: string,
): PlayerStats[] {
  return stats
    .filter((player_stats: PlayerStats) => player_stats.points > 0)
    .filter(
      (player_stats: PlayerStats) =>
        team_filter === ALL_TEAMS_FILTER ||
        player_stats.team_name === team_filter,
    )
    .sort((left: PlayerStats, right: PlayerStats) => right.points - left.points)
    .slice(0, STATS_LEADERBOARD_SIZE);
}
