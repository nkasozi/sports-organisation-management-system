import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "./CompetitionFormatFactories";
import type {
  CompetitionFormatStageTemplate,
  CreateCompetitionFormatInput,
  FormatType,
  LeagueConfig,
  PointsConfig,
} from "./CompetitionFormatTypes";
import { DEFAULT_POINTS_CONFIG } from "./CompetitionFormatTypes";
import { create_default_stage_templates } from "./CompetitionStage";
import { FORMAT_TYPE } from "./StatusConstants";

export function validate_competition_format_input(
  input: CreateCompetitionFormatInput,
): { is_valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push("Name is required");
  }
  if (!input.code || input.code.trim().length === 0) {
    errors.push("Code is required");
  }
  if (input.min_teams_required < 2) {
    errors.push("Minimum teams required must be at least 2");
  }
  if (input.max_teams_allowed < input.min_teams_required) {
    errors.push("Maximum teams must be greater than or equal to minimum teams");
  }

  if (
    requires_group_stage_config(input.format_type) &&
    !input.group_stage_config
  ) {
    errors.push("Group stage configuration is required for this format type");
  }
  if (
    requires_knockout_stage_config(input.format_type) &&
    !input.knockout_stage_config
  ) {
    errors.push(
      "Knockout stage configuration is required for this format type",
    );
  }
  if (requires_league_config(input.format_type) && !input.league_config) {
    errors.push("League configuration is required for this format type");
  }
  if (input.stage_templates.length === 0) {
    errors.push("At least one stage template is required");
  }

  for (const stage_template of input.stage_templates) {
    if (!stage_template.name || stage_template.name.trim().length === 0) {
      errors.push("Each stage template must have a name");
      break;
    }
    if (stage_template.stage_order < 1) {
      errors.push("Stage template order must be at least 1");
      break;
    }
  }

  return { is_valid: errors.length === 0, errors };
}

export function hydrate_competition_format_input(
  input: CreateCompetitionFormatInput,
): CreateCompetitionFormatInput {
  const league_config = requires_league_config(input.format_type)
    ? (input.league_config ?? create_default_league_config())
    : null;
  const group_stage_config = requires_group_stage_config(input.format_type)
    ? (input.group_stage_config ?? create_default_group_stage_config())
    : null;
  const knockout_stage_config = requires_knockout_stage_config(
    input.format_type,
  )
    ? (input.knockout_stage_config ?? create_default_knockout_stage_config())
    : null;

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

function requires_group_stage_config(format_type: FormatType): boolean {
  return ["groups_knockout", "groups_playoffs"].includes(format_type);
}

function requires_knockout_stage_config(format_type: FormatType): boolean {
  return [
    "groups_knockout",
    "straight_knockout",
    "double_elimination",
  ].includes(format_type);
}

function requires_league_config(format_type: FormatType): boolean {
  return [FORMAT_TYPE.LEAGUE, FORMAT_TYPE.ROUND_ROBIN].includes(format_type);
}

function normalize_stage_templates(
  stage_templates: CreateCompetitionFormatInput["stage_templates"],
  format_type: FormatType,
  league_config: LeagueConfig | null,
): CreateCompetitionFormatInput["stage_templates"] {
  const source_templates =
    stage_templates.length > 0
      ? stage_templates
      : create_default_stage_templates(format_type, league_config ?? undefined);

  return source_templates.map((template, index) => ({
    name: template.name,
    stage_type: template.stage_type,
    stage_order: index + 1,
  }));
}
