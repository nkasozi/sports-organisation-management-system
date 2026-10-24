import type { CardTypeSource } from "$lib/core/entities/SportEventCatalog";
import type { CardTypeConfig } from "$lib/core/types/MatchReportTypes";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

import type { PlayerStats } from "./competitionResultsStats";
import type { FairPlayCardWeights } from "./competitionStandingsFairPlay";
import { GAME_EVENT_TYPE } from "./gameEventConstants";

export type { PlayerStats } from "./competitionResultsStats";

export const CARD_SORT_KIND = {
  TOTAL: "total",
  CARD_TYPE: "card_type",
} as const;

export type CardSortMode =
  | { kind: typeof CARD_SORT_KIND.TOTAL }
  | { kind: typeof CARD_SORT_KIND.CARD_TYPE; card_type_id: string };

export const TOTAL_CARD_SORT_MODE: CardSortMode = {
  kind: CARD_SORT_KIND.TOTAL,
};

export interface CardStatCategory {
  card_type_id: string;
  label: string;
  color: string;
  weight: number;
  event_types: readonly string[];
}

interface CardStatCategorySource {
  card_types: readonly CardTypeSource[];
  card_type_colors: readonly CardTypeConfig[];
  card_weights: FairPlayCardWeights;
}

const ALL_TEAMS_FILTER = "all";
const STATS_LEADERBOARD_SIZE = 10;
const DEFAULT_CARD_COLOR = "#6B7280";
const DEFAULT_CARD_WEIGHT = 1;
const NO_CARDS = 0;
const CARD_EVENT_ALIASES: Readonly<Record<string, readonly string[]>> = {
  [GAME_EVENT_TYPE.RED_CARD]: [GAME_EVENT_TYPE.SECOND_YELLOW],
};

function build_category(
  card_type: CardTypeSource,
  source: CardStatCategorySource,
): CardStatCategory {
  const color_config = source.card_type_colors.find(
    (config) => config.id === card_type.id,
  );
  return {
    card_type_id: card_type.id,
    label: card_type.name,
    color: color_config ? color_config.color : DEFAULT_CARD_COLOR,
    weight: source.card_weights.get(card_type.id) ?? DEFAULT_CARD_WEIGHT,
    event_types: [card_type.id, ...(CARD_EVENT_ALIASES[card_type.id] ?? [])],
  };
}

export function build_card_stat_categories(
  source: CardStatCategorySource,
): CardStatCategory[] {
  const unique_card_types = [
    ...new Map(source.card_types.map((card) => [card.id, card])).values(),
  ];
  return unique_card_types.map((card_type) =>
    build_category(card_type, source),
  );
}

export function resolve_card_type_for_event(
  categories: readonly CardStatCategory[],
  event_type: string,
): Option<string> {
  const category = categories.find((candidate) =>
    candidate.event_types.includes(event_type),
  );
  return category
    ? create_some_option(category.card_type_id)
    : create_none_option();
}

export function create_card_type_sort_mode(card_type_id: string): CardSortMode {
  return { kind: CARD_SORT_KIND.CARD_TYPE, card_type_id };
}

function card_sort_mode_key(sort_mode: CardSortMode): string {
  switch (sort_mode.kind) {
    case CARD_SORT_KIND.TOTAL:
      return CARD_SORT_KIND.TOTAL;
    case CARD_SORT_KIND.CARD_TYPE:
      return `${CARD_SORT_KIND.CARD_TYPE}:${sort_mode.card_type_id}`;
  }
}

export function is_card_sort_mode_selected(
  current_mode: CardSortMode,
  candidate_mode: CardSortMode,
): boolean {
  return (
    card_sort_mode_key(current_mode) === card_sort_mode_key(candidate_mode)
  );
}

export function count_player_card_type(
  player_stats: PlayerStats,
  card_type_id: string,
): number {
  return player_stats.card_counts[card_type_id] ?? NO_CARDS;
}

function calculate_card_score(
  player_stats: PlayerStats,
  sort_mode: CardSortMode,
  categories: readonly CardStatCategory[],
): number {
  switch (sort_mode.kind) {
    case CARD_SORT_KIND.CARD_TYPE:
      return count_player_card_type(player_stats, sort_mode.card_type_id);
    case CARD_SORT_KIND.TOTAL:
      return categories.reduce(
        (total, category) =>
          total +
          count_player_card_type(player_stats, category.card_type_id) *
            category.weight,
        NO_CARDS,
      );
  }
}

export function filter_and_sort_card_players(
  stats: PlayerStats[],
  team_filter: string,
  sort_mode: CardSortMode,
  categories: readonly CardStatCategory[],
): PlayerStats[] {
  return stats
    .map((player_stats) => ({
      player_stats,
      score: calculate_card_score(player_stats, sort_mode, categories),
    }))
    .filter((entry) => entry.score > NO_CARDS)
    .filter(
      (entry) =>
        team_filter === ALL_TEAMS_FILTER ||
        entry.player_stats.team_name === team_filter,
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, STATS_LEADERBOARD_SIZE)
    .map((entry) => entry.player_stats);
}
