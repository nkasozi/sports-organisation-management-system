import type { CompetitionTeam } from "../../core/entities/CompetitionTeam";
import type { ScalarInput } from "../../core/types/DomainScalars";

type DefaultCompetitionTeamRow = Omit<
  ScalarInput<CompetitionTeam>,
  "created_at" | "updated_at"
>;

const DEFAULT_COMPETITION_TEAM_ROWS: DefaultCompetitionTeamRow[] = [
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
  },
];

export function create_default_competition_teams(): ScalarInput<CompetitionTeam>[] {
  const now = new Date().toISOString();
  return DEFAULT_COMPETITION_TEAM_ROWS.map(
    (row) =>
      ({
        ...row,
        created_at: now,
        updated_at: now,
      }) as ScalarInput<CompetitionTeam>,
  );
}
