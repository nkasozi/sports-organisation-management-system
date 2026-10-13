import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import {
  GAME_EVENT_TYPE,
  TEAM_SIDE,
} from "$lib/presentation/logic/gameEventConstants";

export const CARD_SORT_MODE = {
  TOTAL: "total",
  YELLOW: "yellow",
  RED: "red",
} as const;

export type CardSortMode = (typeof CARD_SORT_MODE)[keyof typeof CARD_SORT_MODE];

const ALL_TEAMS_FILTER = "all";
const UNKNOWN_TEAM_NAME = "Unknown";
const STATS_LEADERBOARD_SIZE = 10;
const RED_CARD_WEIGHT = 2;

export interface PlayerStats {
  player_name: string;
  team_name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
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
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
  };
  stats_map.set(player_key, created_player_stats);
  return created_player_stats;
}

function apply_game_event_to_player_stats(
  player_stats: PlayerStats,
  game_event: FixtureGameEvent,
): PlayerStats {
  switch (game_event.event_type) {
    case GAME_EVENT_TYPE.GOAL:
    case GAME_EVENT_TYPE.PENALTY_SCORED:
      player_stats.goals += 1;
      return player_stats;
    case GAME_EVENT_TYPE.YELLOW_CARD:
      player_stats.yellow_cards += 1;
      return player_stats;
    case GAME_EVENT_TYPE.RED_CARD:
    case GAME_EVENT_TYPE.SECOND_YELLOW:
      player_stats.red_cards += 1;
      return player_stats;
    case GAME_EVENT_TYPE.OWN_GOAL:
    case GAME_EVENT_TYPE.PENALTY_MISSED:
    case GAME_EVENT_TYPE.GREEN_CARD:
    case GAME_EVENT_TYPE.SUBSTITUTION:
    case GAME_EVENT_TYPE.FOUL:
    case GAME_EVENT_TYPE.OFFSIDE:
    case GAME_EVENT_TYPE.CORNER:
    case GAME_EVENT_TYPE.FREE_KICK:
    case GAME_EVENT_TYPE.INJURY:
    case GAME_EVENT_TYPE.VAR_REVIEW:
    case GAME_EVENT_TYPE.PERIOD_START:
    case GAME_EVENT_TYPE.PERIOD_END:
      return player_stats;
  }
}

export function calculate_player_stats(
  fixtures: Fixture[],
  team_map: Map<string, Team>,
): PlayerStats[] {
  const stats_map = new Map<string, PlayerStats>();

  for (const fixture of fixtures) {
    for (const game_event of fixture.game_events ?? []) {
      if (!game_event.player_name) continue;
      apply_game_event_to_player_stats(
        get_or_create_player_stats(stats_map, fixture, game_event, team_map),
        game_event,
      );
    }
  }

  return [...stats_map.values()].sort(
    (left: PlayerStats, right: PlayerStats) => right.goals - left.goals,
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
    .filter((player_stats: PlayerStats) => player_stats.goals > 0)
    .filter(
      (player_stats: PlayerStats) =>
        team_filter === ALL_TEAMS_FILTER ||
        player_stats.team_name === team_filter,
    )
    .sort((left: PlayerStats, right: PlayerStats) => right.goals - left.goals)
    .slice(0, STATS_LEADERBOARD_SIZE);
}

const CARD_SORT_COMPARATORS: Record<
  CardSortMode,
  (left: PlayerStats, right: PlayerStats) => number
> = {
  [CARD_SORT_MODE.YELLOW]: (left: PlayerStats, right: PlayerStats) =>
    right.yellow_cards - left.yellow_cards,
  [CARD_SORT_MODE.RED]: (left: PlayerStats, right: PlayerStats) =>
    right.red_cards - left.red_cards,
  [CARD_SORT_MODE.TOTAL]: (left: PlayerStats, right: PlayerStats) =>
    right.yellow_cards +
    right.red_cards * RED_CARD_WEIGHT -
    (left.yellow_cards + left.red_cards * RED_CARD_WEIGHT),
};

export function filter_and_sort_card_players(
  stats: PlayerStats[],
  team_filter: string,
  sort_mode: CardSortMode,
): PlayerStats[] {
  return stats
    .filter(
      (player_stats: PlayerStats) =>
        player_stats.yellow_cards > 0 || player_stats.red_cards > 0,
    )
    .filter(
      (player_stats: PlayerStats) =>
        team_filter === ALL_TEAMS_FILTER ||
        player_stats.team_name === team_filter,
    )
    .sort(CARD_SORT_COMPARATORS[sort_mode])
    .slice(0, STATS_LEADERBOARD_SIZE);
}
