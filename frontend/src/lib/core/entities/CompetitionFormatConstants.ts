import type { FormatType } from "./CompetitionFormatTypes";
import { FORMAT_TYPE } from "./StatusConstants";

export const MINIMUM_TEAMS_REQUIRED = 2;

export const GROUP_STAGE_FORMAT_TYPES: ReadonlySet<FormatType> = new Set([
  FORMAT_TYPE.GROUPS_KNOCKOUT,
  FORMAT_TYPE.GROUPS_PLAYOFFS,
]);

export const KNOCKOUT_STAGE_FORMAT_TYPES: ReadonlySet<FormatType> = new Set([
  FORMAT_TYPE.GROUPS_KNOCKOUT,
  FORMAT_TYPE.STRAIGHT_KNOCKOUT,
  FORMAT_TYPE.DOUBLE_ELIMINATION,
]);

export const LEAGUE_FORMAT_TYPES: ReadonlySet<FormatType> = new Set([
  FORMAT_TYPE.LEAGUE,
  FORMAT_TYPE.ROUND_ROBIN,
]);

export const COMPETITION_FORMAT_VALIDATION_MESSAGES = {
  NAME_REQUIRED: "Name is required",
  CODE_REQUIRED: "Code is required",
  MIN_TEAMS_TOO_LOW: "Minimum teams required must be at least 2",
  MAX_BELOW_MIN_TEAMS:
    "Maximum teams must be greater than or equal to minimum teams",
  GROUP_CONFIG_REQUIRED:
    "Group stage configuration is required for this format type",
  KNOCKOUT_CONFIG_REQUIRED:
    "Knockout stage configuration is required for this format type",
  LEAGUE_CONFIG_REQUIRED:
    "League configuration is required for this format type",
  STAGE_TEMPLATE_REQUIRED: "At least one stage template is required",
  STAGE_TEMPLATE_NAME_REQUIRED: "Each stage template must have a name",
  STAGE_TEMPLATE_ORDER_INVALID: "Stage template order must be at least 1",
} as const;
