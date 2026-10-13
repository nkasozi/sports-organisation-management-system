import {
  COMPETITION_FORMAT_VALIDATION_MESSAGES,
  GROUP_STAGE_FORMAT_TYPES,
  KNOCKOUT_STAGE_FORMAT_TYPES,
  LEAGUE_FORMAT_TYPES,
  MINIMUM_TEAMS_REQUIRED,
} from "./CompetitionFormatConstants";
import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "./CompetitionFormatFactories";
import type {
  CreateCompetitionFormatInput,
  FormatType,
  LeagueConfig,
  PointsConfig,
} from "./CompetitionFormatTypes";
import { DEFAULT_POINTS_CONFIG } from "./CompetitionFormatTypes";
import { create_default_stage_templates } from "./CompetitionStage";

type CompetitionFormatValidation = { is_valid: boolean; errors: string[] };

export function validate_competition_format_input(
  input: CreateCompetitionFormatInput,
): CompetitionFormatValidation {
  const errors: string[] = [
    ...collect_identity_and_team_count_errors(input),
    ...collect_stage_config_errors(input),
    ...collect_stage_template_errors(input.stage_templates),
  ];
  return { is_valid: errors.length === 0, errors };
}

function is_blank(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

function collect_identity_and_team_count_errors(
  input: CreateCompetitionFormatInput,
): string[] {
  const errors: string[] = [];
  if (is_blank(input.name)) {
    errors.push(COMPETITION_FORMAT_VALIDATION_MESSAGES.NAME_REQUIRED);
  }
  if (is_blank(input.code)) {
    errors.push(COMPETITION_FORMAT_VALIDATION_MESSAGES.CODE_REQUIRED);
  }
  if (input.min_teams_required < MINIMUM_TEAMS_REQUIRED) {
    errors.push(COMPETITION_FORMAT_VALIDATION_MESSAGES.MIN_TEAMS_TOO_LOW);
  }
  if (input.max_teams_allowed < input.min_teams_required) {
    errors.push(COMPETITION_FORMAT_VALIDATION_MESSAGES.MAX_BELOW_MIN_TEAMS);
  }
  return errors;
}

function collect_stage_config_errors(
  input: CreateCompetitionFormatInput,
): string[] {
  const errors: string[] = [];
  if (
    GROUP_STAGE_FORMAT_TYPES.has(input.format_type) &&
    !input.group_stage_config
  ) {
    errors.push(COMPETITION_FORMAT_VALIDATION_MESSAGES.GROUP_CONFIG_REQUIRED);
  }
  if (
    KNOCKOUT_STAGE_FORMAT_TYPES.has(input.format_type) &&
    !input.knockout_stage_config
  ) {
    errors.push(
      COMPETITION_FORMAT_VALIDATION_MESSAGES.KNOCKOUT_CONFIG_REQUIRED,
    );
  }
  if (LEAGUE_FORMAT_TYPES.has(input.format_type) && !input.league_config) {
    errors.push(COMPETITION_FORMAT_VALIDATION_MESSAGES.LEAGUE_CONFIG_REQUIRED);
  }
  return errors;
}

function collect_stage_template_errors(
  stage_templates: CreateCompetitionFormatInput["stage_templates"],
): string[] {
  if (stage_templates.length === 0) {
    return [COMPETITION_FORMAT_VALIDATION_MESSAGES.STAGE_TEMPLATE_REQUIRED];
  }
  for (const stage_template of stage_templates) {
    if (is_blank(stage_template.name)) {
      return [
        COMPETITION_FORMAT_VALIDATION_MESSAGES.STAGE_TEMPLATE_NAME_REQUIRED,
      ];
    }
    if (stage_template.stage_order < 1) {
      return [
        COMPETITION_FORMAT_VALIDATION_MESSAGES.STAGE_TEMPLATE_ORDER_INVALID,
      ];
    }
  }
  return [];
}

export function hydrate_competition_format_input(
  input: CreateCompetitionFormatInput,
): CreateCompetitionFormatInput {
  const league_config = input.league_config ?? create_default_league_config();
  const group_stage_config =
    input.group_stage_config ?? create_default_group_stage_config();
  const knockout_stage_config =
    input.knockout_stage_config ?? create_default_knockout_stage_config();

  const points_config: PointsConfig = input.points_config ?? {
    ...DEFAULT_POINTS_CONFIG,
  };

  return {
    ...input,
    points_config,
    league_config,
    group_stage_config,
    knockout_stage_config,
    stage_templates: normalize_stage_templates(
      input.stage_templates,
      input.format_type,
      league_config,
    ),
  };
}

function normalize_stage_templates(
  stage_templates: CreateCompetitionFormatInput["stage_templates"],
  format_type: FormatType,
  league_config: LeagueConfig,
): CreateCompetitionFormatInput["stage_templates"] {
  const source_templates =
    stage_templates.length > 0
      ? stage_templates
      : create_default_stage_templates(format_type, league_config);

  return source_templates.map((template, index) => ({
    name: template.name,
    stage_type: template.stage_type,
    stage_order: index + 1,
  }));
}
