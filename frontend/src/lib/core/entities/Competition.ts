import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type {
  CardType,
  FoulCategory,
  SportGamePeriod,
  OfficialRequirement,
  OvertimeRule,
  ScoringRule,
  SubstitutionRule,
} from "./Sport";

export type CompetitionDerivedStatus = "upcoming" | "active" | "completed";

export interface CompetitionRuleOverrides {
  game_duration_minutes?: number;
  periods?: SportGamePeriod[];
  additional_card_types?: CardType[];
  additional_foul_categories?: FoulCategory[];
  official_requirements?: OfficialRequirement[];
  overtime_rules?: Partial<OvertimeRule>;
  scoring_rules?: ScoringRule[];
  substitution_rules?: Partial<SubstitutionRule>;
  max_players_on_field?: number;
  min_players_on_field?: number;
  max_squad_size?: number;
  custom_rules?: Record<string, unknown>;
}

export interface Competition extends BaseEntity {
  name: string;
  description: string;
  organization_id: string;
  competition_format_id: string;
  team_ids: string[];
  allow_auto_squad_submission: boolean;
  allow_auto_fixture_details_setup: boolean;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_teams: number;
  entry_fee: number;
  prize_pool: number;
  location: string;
  rule_overrides: CompetitionRuleOverrides;
  status: EntityStatus;
}

export function derive_competition_status(
  start_date: string,
  end_date: string,
  reference_date: Date = new Date(),
): CompetitionDerivedStatus {
  const start = new Date(start_date);
  const end = new Date(end_date);
  const today = new Date(reference_date.toISOString().split("T")[0]);

  if (today < start) {
    return "upcoming";
  }
  if (today > end) {
    return "completed";
  }
  return "active";
}

export function get_competition_status_display(
  status: CompetitionDerivedStatus,
): { label: string; color: string } {
  switch (status) {
    case "upcoming":
      return {
        label: "Upcoming",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    case "active":
      return {
        label: "Active",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    case "completed":
      return {
        label: "Completed",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      };
  }
}

export type CreateCompetitionInput = Omit<
  Competition,
  "id" | "created_at" | "updated_at"
>;
export type UpdateCompetitionInput = Partial<CreateCompetitionInput>;

export function create_empty_competition_input(
  organization_id: string = "",
): CreateCompetitionInput {
  const today = new Date();
  const next_month = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );
  const two_months_later = new Date(
    today.getFullYear(),
    today.getMonth() + 2,
    today.getDate(),
  );

  return {
    name: "",
    description: "",
    organization_id,
    competition_format_id: "",
    team_ids: [],
    allow_auto_squad_submission: false,
    allow_auto_fixture_details_setup: false,
    start_date: next_month.toISOString().split("T")[0],
    end_date: two_months_later.toISOString().split("T")[0],
    registration_deadline: today.toISOString().split("T")[0],
    max_teams: 16,
    entry_fee: 0,
    prize_pool: 0,
    location: "",
    rule_overrides: {},
    status: "active",
  };
}

export function validate_competition_input(
  input: CreateCompetitionInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Competition name must be at least 2 characters");
  }

  if (!input.organization_id) {
    validation_errors.push("Organization is required");
  }

  if (!input.competition_format_id) {
    validation_errors.push("Competition format is required");
  }

  if (!input.start_date) {
    validation_errors.push("Start date is required");
  }

  if (!input.end_date) {
    validation_errors.push("End date is required");
  }

  if (
    input.start_date &&
    input.end_date &&
    new Date(input.start_date) > new Date(input.end_date)
  ) {
    validation_errors.push("End date must be after start date");
  }

  if (input.max_teams < 2) {
    validation_errors.push("Maximum teams must be at least 2");
  }

  return validation_errors;
}
export function merge_sport_and_competition_rules(
  sport_rules: Partial<CompetitionRuleOverrides>,
  competition_overrides: CompetitionRuleOverrides,
): CompetitionRuleOverrides {
  return {
    game_duration_minutes:
      competition_overrides.game_duration_minutes ??
      sport_rules.game_duration_minutes,
    periods: competition_overrides.periods ?? sport_rules.periods,
    additional_card_types:
      competition_overrides.additional_card_types ??
      sport_rules.additional_card_types,
    additional_foul_categories:
      competition_overrides.additional_foul_categories ??
      sport_rules.additional_foul_categories,
    official_requirements:
      competition_overrides.official_requirements ??
      sport_rules.official_requirements,
    overtime_rules:
      competition_overrides.overtime_rules ?? sport_rules.overtime_rules,
    scoring_rules:
      competition_overrides.scoring_rules ?? sport_rules.scoring_rules,
    substitution_rules:
      competition_overrides.substitution_rules ??
      sport_rules.substitution_rules,
    max_players_on_field:
      competition_overrides.max_players_on_field ??
      sport_rules.max_players_on_field,
    min_players_on_field:
      competition_overrides.min_players_on_field ??
      sport_rules.min_players_on_field,
    max_squad_size:
      competition_overrides.max_squad_size ?? sport_rules.max_squad_size,
    custom_rules: {
      ...sport_rules.custom_rules,
      ...competition_overrides.custom_rules,
    },
  };
}
