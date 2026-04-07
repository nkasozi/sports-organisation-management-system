import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

export type CardSortMode = "total" | "yellow" | "red";

export interface PlayerStats {
  player_name: string;
  team_name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

export function calculate_player_stats(
  fixtures: Fixture[],
  team_map: Map<string, Team>,
): PlayerStats[] {
  const stats_map = new Map<string, PlayerStats>();

  for (const fixture of fixtures) {
    if (!fixture.game_events) continue;

    for (const game_event of fixture.game_events) {
      if (!game_event.player_name) continue;

      const player_key = `${game_event.player_name}-${game_event.team_side}`;
      if (!stats_map.has(player_key)) {
        const team =
          game_event.team_side === "home"
            ? team_map.get(fixture.home_team_id)
            : team_map.get(fixture.away_team_id);
        stats_map.set(player_key, {
          player_name: game_event.player_name,
          team_name: team?.name ?? "Unknown",
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
        });
      }

      const player_stats = stats_map.get(player_key);
      if (!player_stats) continue;

      switch (game_event.event_type) {
        case "goal":
        case "penalty_scored":
          player_stats.goals += 1;
          break;
        case "yellow_card":
          player_stats.yellow_cards += 1;
          break;
        case "red_card":
        case "second_yellow":
          player_stats.red_cards += 1;
          break;
      }
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
        team_filter === "all" || player_stats.team_name === team_filter,
    )
    .sort((left: PlayerStats, right: PlayerStats) => right.goals - left.goals)
    .slice(0, 10);
}

export function filter_and_sort_card_players(
  stats: PlayerStats[],
  team_filter: string,
  sort_mode: CardSortMode,
): PlayerStats[] {
  const filtered_stats = stats
    .filter(
      (player_stats: PlayerStats) =>
        player_stats.yellow_cards > 0 || player_stats.red_cards > 0,
    )
    .filter(
      (player_stats: PlayerStats) =>
        team_filter === "all" || player_stats.team_name === team_filter,
    );

  switch (sort_mode) {
    case "yellow":
      return filtered_stats
        .sort(
          (left: PlayerStats, right: PlayerStats) =>
            right.yellow_cards - left.yellow_cards,
        )
        .slice(0, 10);
    case "red":
      return filtered_stats
        .sort(
          (left: PlayerStats, right: PlayerStats) =>
            right.red_cards - left.red_cards,
        )
        .slice(0, 10);
    default:
      return filtered_stats
        .sort(
          (left: PlayerStats, right: PlayerStats) =>
            right.yellow_cards +
            right.red_cards * 2 -
            (left.yellow_cards + left.red_cards * 2),
        )
        .slice(0, 10);
  }
}
