import {
  COMPETITION_STATUS_DISPLAY,
  COMPETITION_VALIDATION_MESSAGES,
  DEFAULT_COMPETITION_LINEUP_DEADLINE_HOURS,
  DEFAULT_COMPETITION_MAX_TEAMS,
  MINIMUM_COMPETITION_MAX_TEAMS,
  MINIMUM_COMPETITION_NAME_LENGTH,
} from "./CompetitionConstants";
import {
  COMPETITION_DERIVED_STATUS,
  type CompetitionDerivedStatus,
  type CompetitionRuleOverrides,
  type CreateCompetitionInput,
  SQUAD_GENERATION_STRATEGY,
} from "./CompetitionTypes";
import {
  check_condition,
  collect_validation_errors,
  type FieldCheck,
} from "./EntityValidation";
import { ENTITY_STATUS } from "./StatusConstants";

const ISO_DATE_TIME_SEPARATOR = "T";

function to_iso_date(date: Date): string {
  return date.toISOString().split(ISO_DATE_TIME_SEPARATOR)[0];
}

export function derive_competition_status(
  start_date: CreateCompetitionInput["start_date"],
  end_date: CreateCompetitionInput["end_date"],
  reference_date: Date = new Date(),
): CompetitionDerivedStatus {
  const start = new Date(start_date);
  const end = new Date(end_date);
  const today = new Date(to_iso_date(reference_date));

  if (today < start) {
    return COMPETITION_DERIVED_STATUS.UPCOMING;
  }
  if (today > end) {
    return COMPETITION_DERIVED_STATUS.COMPLETED;
  }
  return COMPETITION_DERIVED_STATUS.ACTIVE;
}

export function get_competition_status_display(
  status: CompetitionDerivedStatus,
): { label: string; color: string } {
  return { ...COMPETITION_STATUS_DISPLAY[status] };
}

export function create_empty_competition_input(
  organization_id: CreateCompetitionInput["organization_id"] = "",
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
    squad_generation_strategy: SQUAD_GENERATION_STRATEGY.FIRST_AVAILABLE,
    allow_auto_fixture_details_setup: false,
    lineup_submission_deadline_hours: DEFAULT_COMPETITION_LINEUP_DEADLINE_HOURS,
    start_date: to_iso_date(next_month),
    end_date: to_iso_date(two_months_later),
    registration_deadline: to_iso_date(today),
    max_teams: DEFAULT_COMPETITION_MAX_TEAMS,
    entry_fee: 0,
    prize_pool: 0,
    location: "",
    rule_overrides: {},
    status: ENTITY_STATUS.ACTIVE,
  };
}

export function validate_competition_input(
  input: CreateCompetitionInput,
): string[] {
  return collect_validation_errors([
    check_condition(
      (input.name ?? "").trim().length >= MINIMUM_COMPETITION_NAME_LENGTH,
      COMPETITION_VALIDATION_MESSAGES.NAME_TOO_SHORT,
    ),
    check_condition(
      Boolean(input.organization_id),
      COMPETITION_VALIDATION_MESSAGES.ORGANIZATION_REQUIRED,
    ),
    check_condition(
      Boolean(input.competition_format_id),
      COMPETITION_VALIDATION_MESSAGES.FORMAT_REQUIRED,
    ),
    check_condition(
      Boolean(input.start_date),
      COMPETITION_VALIDATION_MESSAGES.START_DATE_REQUIRED,
    ),
    check_condition(
      Boolean(input.end_date),
      COMPETITION_VALIDATION_MESSAGES.END_DATE_REQUIRED,
    ),
    check_competition_date_order(input),
    check_condition(
      input.max_teams >= MINIMUM_COMPETITION_MAX_TEAMS,
      COMPETITION_VALIDATION_MESSAGES.MAX_TEAMS_TOO_LOW,
    ),
  ]);
}

function check_competition_date_order(
  input: CreateCompetitionInput,
): FieldCheck {
  const has_both_dates = Boolean(input.start_date) && Boolean(input.end_date);
  return check_condition(
    !has_both_dates || new Date(input.start_date) <= new Date(input.end_date),
    COMPETITION_VALIDATION_MESSAGES.END_BEFORE_START,
  );
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
