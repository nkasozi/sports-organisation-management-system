import type {
  EntityId,
  IsoDateString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export type CompetitionTeamStatus =
  | "registered"
  | "confirmed"
  | "withdrawn"
  | "disqualified"
  | "eliminated";

export interface CompetitionTeam extends BaseEntity {
  competition_id: EntityId;
  team_id: EntityId;
  registration_date: IsoDateString;
  seed_number: number | "";
  group_name: Name | "";
  points: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  matches_played: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  notes: string;
  status: CompetitionTeamStatus;
}

export type CreateCompetitionTeamInput = Omit<
  ScalarInput<CompetitionTeam>,
  | "id"
  | "created_at"
  | "updated_at"
  | "points"
  | "goals_for"
  | "goals_against"
  | "goal_difference"
  | "matches_played"
  | "matches_won"
  | "matches_drawn"
  | "matches_lost"
>;
export type UpdateCompetitionTeamInput = Partial<
  Omit<ScalarInput<CompetitionTeam>, "id" | "created_at" | "updated_at">
>;

export function create_empty_competition_team_input(
  competition_id: CreateCompetitionTeamInput["competition_id"] = "",
  team_id: CreateCompetitionTeamInput["team_id"] = "",
): CreateCompetitionTeamInput {
  return {
    competition_id,
    team_id,
    registration_date: new Date()
      .toISOString()
      .split("T")[0] as CreateCompetitionTeamInput["registration_date"],
    seed_number: "",
    group_name: "",
    notes: "",
    status: "registered",
  };
}

export function create_competition_team_with_stats(
  input: CreateCompetitionTeamInput,
  id: CompetitionTeam["id"],
  timestamps: {
    created_at: CompetitionTeam["created_at"];
    updated_at: CompetitionTeam["updated_at"];
  },
): CompetitionTeam {
  return {
    id,
    ...timestamps,
    ...input,
    points: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    matches_played: 0,
    matches_won: 0,
    matches_drawn: 0,
    matches_lost: 0,
  } as CompetitionTeam;
}

function calculate_goal_difference(team: CompetitionTeam): number {
  return team.goals_for - team.goals_against;
}

function calculate_points(
  wins: number,
  draws: number,
  points_per_win: number = 3,
  points_per_draw: number = 1,
): number {
  return wins * points_per_win + draws * points_per_draw;
}

function update_competition_team_after_match(
  team: CompetitionTeam,
  goals_scored: number,
  goals_conceded: number,
  result: "win" | "draw" | "loss",
  points_per_win: number = 3,
  points_per_draw: number = 1,
): CompetitionTeam {
  const updated_team = { ...team };

  updated_team.matches_played += 1;
  updated_team.goals_for += goals_scored;
  updated_team.goals_against += goals_conceded;
  updated_team.goal_difference =
    updated_team.goals_for - updated_team.goals_against;

  switch (result) {
    case "win":
      updated_team.matches_won += 1;
      updated_team.points += points_per_win;
      break;
    case "draw":
      updated_team.matches_drawn += 1;
      updated_team.points += points_per_draw;
      break;
    case "loss":
      updated_team.matches_lost += 1;
      break;
  }

  return updated_team;
}

export function validate_competition_team_input(
  input: CreateCompetitionTeamInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.competition_id) {
    validation_errors.push("Competition is required");
  }

  if (!input.team_id) {
    validation_errors.push("Team is required");
  }

  if (!input.registration_date) {
    validation_errors.push("Registration date is required");
  }

  return validation_errors;
}

function sort_teams_by_standings(teams: CompetitionTeam[]): CompetitionTeam[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference)
      return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.matches_played - b.matches_played;
  });
}
