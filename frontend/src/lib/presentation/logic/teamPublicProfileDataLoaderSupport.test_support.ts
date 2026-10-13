export const EMPTY_PUBLIC_TEAM_STATS = {
  total_matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goals_for: 0,
  goals_against: 0,
  yellow_cards: 0,
  red_cards: 0,
};

export const SINGLE_WIN_PUBLIC_TEAM_STATS = {
  total_matches: 1,
  wins: 1,
  draws: 0,
  losses: 0,
  goals_for: 2,
  goals_against: 1,
  yellow_cards: 1,
  red_cards: 1,
};

export function build_completed_public_team_fixture(): Record<string, unknown> {
  return {
    id: "fixture-1",
    competition_id: "competition-1",
    home_team_id: "team-1",
    away_team_id: "team-2",
    status: "completed",
    home_team_score: 2,
    away_team_score: 1,
    scheduled_date: "2024-05-01T10:00:00.000Z",
    game_events: [
      { team_side: "home", event_type: "yellow_card" },
      { team_side: "home", event_type: "red_card" },
    ],
  };
}

export function build_scheduled_public_team_fixture(): Record<string, unknown> {
  return {
    id: "fixture-2",
    competition_id: "competition-1",
    home_team_id: "team-2",
    away_team_id: "team-1",
    status: "scheduled",
    home_team_score: 0,
    away_team_score: 0,
    scheduled_date: "2024-06-01T10:00:00.000Z",
    game_events: [],
  };
}
