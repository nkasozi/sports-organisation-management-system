import type { Fixture } from "$lib/core/entities/Fixture";
import { OptionStatus } from "$lib/core/types/Option";

import {
  type CardStatCategory,
  count_player_card_type,
  resolve_card_type_for_event,
} from "./competitionResultsCardStats";
import {
  PLAYER_STAT_MOMENT_KIND,
  type PlayerStatMomentContext,
} from "./competitionResultsPlayerMoments";
import type { PlayerStats } from "./competitionResultsStats";

const SINGLE_CARD = 1;
const ASSIST_EVENT_TYPE = "assist";

type FixtureGameEvent = NonNullable<Fixture["game_events"]>[number];

function apply_card_to_player_stats(
  player_stats: PlayerStats,
  game_event: FixtureGameEvent,
  context: PlayerStatMomentContext,
  card_categories: readonly CardStatCategory[],
): PlayerStats {
  const card_type = resolve_card_type_for_event(
    card_categories,
    game_event.event_type,
  );
  if (card_type.status === OptionStatus.NONE) return player_stats;
  player_stats.card_counts[card_type.value] =
    count_player_card_type(player_stats, card_type.value) + SINGLE_CARD;
  player_stats.moments.push({
    ...context,
    kind: PLAYER_STAT_MOMENT_KIND.CARD,
    card_type_id: card_type.value,
  });
  return player_stats;
}

export function apply_unscored_event(
  player_stats: PlayerStats,
  game_event: FixtureGameEvent,
  context: PlayerStatMomentContext,
  card_categories: readonly CardStatCategory[],
): PlayerStats {
  if (game_event.event_type !== ASSIST_EVENT_TYPE)
    return apply_card_to_player_stats(
      player_stats,
      game_event,
      context,
      card_categories,
    );
  player_stats.assists += 1;
  player_stats.moments.push({
    ...context,
    kind: PLAYER_STAT_MOMENT_KIND.ASSIST,
  });
  return player_stats;
}
