import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

export interface TeamPublicProfileStats {
  total_matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  yellow_cards: number;
  red_cards: number;
}

export interface CompetitionPublicProfileStats {
  competition: Competition;
  stats: TeamPublicProfileStats;
  upcoming_fixtures: Fixture[];
}

export function create_empty_team_public_profile_stats(): TeamPublicProfileStats {
  return {
    total_matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    yellow_cards: 0,
    red_cards: 0,
  };
}

export function apply_fixture_to_team_public_profile_stats(
  stats: TeamPublicProfileStats,
  fixture: Fixture,
  team_id: string,
): TeamPublicProfileStats {
  if (
    fixture.status !== "completed" ||
    fixture.home_team_score === null ||
    fixture.away_team_score === null
  ) {
    return stats;
  }

  const is_home_team = fixture.home_team_id === team_id;
  const team_score = is_home_team
    ? fixture.home_team_score
    : fixture.away_team_score;
  const opponent_score = is_home_team
    ? fixture.away_team_score
    : fixture.home_team_score;
  const next_stats = {
    ...stats,
    total_matches: stats.total_matches + 1,
    goals_for: stats.goals_for + team_score,
    goals_against: stats.goals_against + opponent_score,
  };

  if (team_score > opponent_score) {
    next_stats.wins += 1;
  } else if (team_score === opponent_score) {
    next_stats.draws += 1;
  } else {
    next_stats.losses += 1;
  }

  for (const event of fixture.game_events) {
    const event_belongs_to_team = is_home_team
      ? event.team_side === "home"
      : event.team_side === "away";
    if (!event_belongs_to_team) {
      continue;
    }

    if (event.event_type === "yellow_card") {
      next_stats.yellow_cards += 1;
      continue;
    }

    if (event.event_type === "red_card") {
      next_stats.red_cards += 1;
    }
  }

  return next_stats;
}

export function format_team_public_profile_date(date_string: string): string {
  return new Date(date_string).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function build_team_public_profile_fixture_display(
  fixture: Fixture,
  teams_by_id: Map<string, Team>,
): string {
  const home_team_name =
    teams_by_id.get(fixture.home_team_id)?.name || fixture.home_team_id;
  const away_team_name =
    teams_by_id.get(fixture.away_team_id)?.name || fixture.away_team_id;
  return `${home_team_name} vs ${away_team_name}`;
}
