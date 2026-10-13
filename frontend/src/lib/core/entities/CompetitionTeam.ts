import type {
  EntityId,
  IsoDateString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";
import {
  check_condition,
  check_required_entity_id,
  collect_validation_errors,
} from "./EntityValidation";

const ISO_DATE_TIME_SEPARATOR = "T";

const COMPETITION_TEAM_MESSAGES = {
  COMPETITION_REQUIRED: "Competition is required",
  TEAM_REQUIRED: "Team is required",
  REGISTRATION_DATE_REQUIRED: "Registration date is required",
} as const;

export const COMPETITION_TEAM_STATUS = {
  REGISTERED: "registered",
  CONFIRMED: "confirmed",
  WITHDRAWN: "withdrawn",
  DISQUALIFIED: "disqualified",
  ELIMINATED: "eliminated",
} as const;

export type CompetitionTeamStatus =
  (typeof COMPETITION_TEAM_STATUS)[keyof typeof COMPETITION_TEAM_STATUS];

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
      .split(
        ISO_DATE_TIME_SEPARATOR,
      )[0] as CreateCompetitionTeamInput["registration_date"],
    seed_number: "",
    group_name: "",
    notes: "",
    status: COMPETITION_TEAM_STATUS.REGISTERED,
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

export function validate_competition_team_input(
  input: CreateCompetitionTeamInput,
): string[] {
  return collect_validation_errors([
    check_required_entity_id(
      input.competition_id,
      COMPETITION_TEAM_MESSAGES.COMPETITION_REQUIRED,
    ),
    check_required_entity_id(
      input.team_id,
      COMPETITION_TEAM_MESSAGES.TEAM_REQUIRED,
    ),
    check_condition(
      Boolean(input.registration_date),
      COMPETITION_TEAM_MESSAGES.REGISTRATION_DATE_REQUIRED,
    ),
  ]);
}
