export type {
  FormatType,
  TieBreaker,
  GroupStageConfig,
  KnockoutStageConfig,
  PointsConfig,
  LeagueConfig,
  CompetitionFormatStageTemplate,
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
} from "./CompetitionFormatTypes";

export { DEFAULT_POINTS_CONFIG } from "./CompetitionFormatTypes";

export {
  FORMAT_TYPE_OPTIONS,
  TIE_BREAKER_OPTIONS,
  get_format_type_label,
  get_format_type_description,
  create_empty_competition_format_input,
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "./CompetitionFormatFactories";

export {
  validate_competition_format_input,
  hydrate_competition_format_input,
} from "./CompetitionFormatValidation";

export {
  get_default_competition_formats_for_organization,
  get_default_competition_formats,
} from "./CompetitionFormatDefaults";
