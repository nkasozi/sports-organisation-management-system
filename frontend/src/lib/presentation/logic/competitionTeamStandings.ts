import {
  DEFAULT_POINTS_CONFIG,
  type PointsConfig,
  type TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";

import type { TeamStanding } from "./competitionStageResults";
import {
  DEFAULT_FAIR_PLAY_CARD_WEIGHTS,
  type FairPlayCardWeights,
} from "./competitionStandingsFairPlay";
import { build_team_form_map } from "./competitionStandingsForm";
import { sort_standings_by_tiebreakers } from "./competitionStandingsTiebreakers";

const FORM_LAST_N_GAMES = 5;

function create_empty_team_standing(team: Team): TeamStanding {
  return {
    team_id: team.id,
    team_name: team.name,
    team_logo_url: team.logo_url ?? "",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0,
    form: [],
    requires_playoff: false,
  };
}

function award_match_outcome(
  winner_standing: TeamStanding,
  loser_standing: TeamStanding,
  points_config: PointsConfig,
): void {
  winner_standing.won += 1;
  loser_standing.lost += 1;
  winner_standing.points += points_config.points_for_win;
  loser_standing.points += points_config.points_for_loss;
}

function apply_fixture_to_standings(
  fixture: Fixture,
  home_standing: TeamStanding,
  away_standing: TeamStanding,
  points_config: PointsConfig,
): void {
  const home_goals = fixture.home_team_score ?? 0;
  const away_goals = fixture.away_team_score ?? 0;
  home_standing.played += 1;
  away_standing.played += 1;
  home_standing.goals_for += home_goals;
  home_standing.goals_against += away_goals;
  away_standing.goals_for += away_goals;
  away_standing.goals_against += home_goals;
  if (home_goals > away_goals) {
    award_match_outcome(home_standing, away_standing, points_config);
    return;
  }
  if (away_goals > home_goals) {
    award_match_outcome(away_standing, home_standing, points_config);
    return;
  }
  home_standing.drawn += 1;
  away_standing.drawn += 1;
  home_standing.points += points_config.points_for_draw;
  away_standing.points += points_config.points_for_draw;
}

function finalize_team_standings(
  standings: TeamStanding[],
  completed_fixtures: Fixture[],
): TeamStanding[] {
  for (const standing of standings) {
    standing.goal_difference = standing.goals_for - standing.goals_against;
  }
  const form_map = build_team_form_map(completed_fixtures, FORM_LAST_N_GAMES);
  for (const standing of standings) {
    standing.form = form_map.get(standing.team_id) ?? [];
  }
  return standings;
}

export function calculate_team_standings(
  fixtures: Fixture[],
  teams: Team[],
  points_config: PointsConfig = DEFAULT_POINTS_CONFIG,
  tie_breakers: TieBreaker[] = ["goal_difference", "goals_scored"],
  card_weights: FairPlayCardWeights = DEFAULT_FAIR_PLAY_CARD_WEIGHTS,
): TeamStanding[] {
  const standings_map = new Map<string, TeamStanding>();
  for (const team of teams) {
    standings_map.set(team.id, create_empty_team_standing(team));
  }
  const completed_fixtures = fixtures.filter(
    (fixture) => fixture.status === FIXTURE_STATUS.COMPLETED,
  );
  for (const fixture of completed_fixtures) {
    const home_standing = standings_map.get(fixture.home_team_id);
    const away_standing = standings_map.get(fixture.away_team_id);
    if (!home_standing || !away_standing) {
      continue;
    }
    apply_fixture_to_standings(
      fixture,
      home_standing,
      away_standing,
      points_config,
    );
  }

  return sort_standings_by_tiebreakers(
    finalize_team_standings([...standings_map.values()], completed_fixtures),
    completed_fixtures,
    tie_breakers,
    points_config,
    card_weights,
  );
}
