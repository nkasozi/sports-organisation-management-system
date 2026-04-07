import type { CompetitionTeam } from "../../core/entities/CompetitionTeam";

export function create_default_competition_teams(): CompetitionTeam[] {
  const now = new Date().toISOString();
  return [
    {
      id: "comp_team_default_1",
      competition_id: "comp_default_1",
      team_id: "team_default_1",
      registration_date: "2026-01-15",
      seed_number: 1,
      group_name: "Group A",
      points: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      matches_played: 0,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 0,
      notes: "",
      status: "confirmed",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_team_default_2",
      competition_id: "comp_default_1",
      team_id: "team_default_2",
      registration_date: "2026-01-15",
      seed_number: 2,
      group_name: "Group A",
      points: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      matches_played: 0,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 0,
      notes: "",
      status: "confirmed",
      created_at: now,
      updated_at: now,
    },
  ];
}
