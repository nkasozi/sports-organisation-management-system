import type {
  FieldMetadata,
  ForeignKeyFilterConfig,
  ValidationRule,
} from "$lib/core/entities/BaseEntity";

export type DynamicFormData = Record<string, unknown>;

type DynamicFormFieldType = FieldMetadata["field_type"];

export const DYNAMIC_FORM_FIELD_TYPE = {
  STRING: "string",
  NUMBER: "number",
  STAR_RATING: "star_rating",
  BOOLEAN: "boolean",
  DATE: "date",
  ENUM: "enum",
  FOREIGN_KEY: "foreign_key",
  FILE: "file",
  SUB_ENTITY: "sub_entity",
  OFFICIAL_ASSIGNMENT_ARRAY: "official_assignment_array",
  STAGE_TEMPLATE_ARRAY: "stage_template_array",
} as const satisfies Record<string, DynamicFormFieldType>;

type DynamicFormValidationRuleType = ValidationRule["rule_type"];

export const DYNAMIC_FORM_VALIDATION_RULE_TYPE = {
  MIN_LENGTH: "min_length",
  MAX_LENGTH: "max_length",
  MIN_VALUE: "min_value",
  MAX_VALUE: "max_value",
  PATTERN: "pattern",
  CUSTOM: "custom",
} as const satisfies Record<string, DynamicFormValidationRuleType>;

type DynamicFormForeignKeyFilterType = ForeignKeyFilterConfig["filter_type"];

export const DYNAMIC_FORM_FOREIGN_KEY_FILTER_TYPE = {
  TEAMS_FROM_COMPETITION: "teams_from_competition",
} as const satisfies Record<string, DynamicFormForeignKeyFilterType>;

export const DYNAMIC_FORM_INPUT_TYPE = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  FILE: "file",
  EMAIL: "email",
  TEL: "tel",
  URL: "url",
} as const;

export type DynamicFormInputType =
  (typeof DYNAMIC_FORM_INPUT_TYPE)[keyof typeof DYNAMIC_FORM_INPUT_TYPE];

export const DYNAMIC_FORM_FIELD_NAME_HINT = {
  EMAIL: "email",
  PHONE: "phone",
  TEL: "tel",
  ICON: "icon",
  URL: "url",
  WEBSITE: "website",
  LINK: "link",
} as const;

export const DYNAMIC_FORM_JERSEY_FIELD_HINT = "jersey";

export const DYNAMIC_FORM_TITLE_PREFIX = {
  EDIT: "Edit",
  CREATE: "Create",
} as const;

export const DYNAMIC_FORM_ENTITY_TYPE = {
  FIXTURE: "fixture",
  COMPETITION: "competition",
  FIXTURE_DETAILS_SETUP: "fixturedetailssetup",
  SYSTEM_USER: "systemuser",
  COMPETITION_FORMAT: "competitionformat",
  PLAYER_TEAM_MEMBERSHIP: "playerteammembership",
  PLAYER_TEAM_TRANSFER_HISTORY: "playerteamtransferhistory",
} as const;

export const DYNAMIC_FORM_FIELD_NAME = {
  ROLE: "role",
  FORMAT_TYPE: "format_type",
  LEAGUE_CONFIG: "league_config",
  STAGE_TEMPLATES: "stage_templates",
  HOME_TEAM_ID: "home_team_id",
  HOME_TEAM_JERSEY_ID: "home_team_jersey_id",
  AWAY_TEAM_JERSEY_ID: "away_team_jersey_id",
  OFFICIAL_JERSEY_ID: "official_jersey_id",
  AWAY_TEAM_ID: "away_team_id",
  PLAYER_ID: "player_id",
  TEAM_ID: "team_id",
  TO_TEAM_ID: "to_team_id",
  VENUE: "venue",
  COMPETITION_ID: "competition_id",
  FIXTURE_ID: "fixture_id",
  ASSIGNED_OFFICIALS: "assigned_officials",
} as const;

export const DYNAMIC_FORM_TEAM_LABEL = {
  HOME: "Home Team",
  AWAY: "Away Team",
} as const;

export const DYNAMIC_FORM_SYSTEM_USER_ENTITY_KEY =
  DYNAMIC_FORM_ENTITY_TYPE.SYSTEM_USER;
export const DYNAMIC_FORM_ROLE_FIELD_NAME = DYNAMIC_FORM_FIELD_NAME.ROLE;
export const DYNAMIC_FORM_REQUIRED_SUFFIX = "is required";

const ENTITY_TYPE_SEPARATOR_PATTERN = /[\s_-]/g;
const EMPTY_SEPARATOR = "";

export function normalize_dynamic_form_entity_type(
  entity_type: string,
): string {
  return entity_type
    .toLowerCase()
    .replace(ENTITY_TYPE_SEPARATOR_PATTERN, EMPTY_SEPARATOR);
}

export function is_dynamic_form_entity_type(
  entity_type: string,
  expected_entity_type: string,
): boolean {
  return (
    normalize_dynamic_form_entity_type(entity_type) === expected_entity_type
  );
}
