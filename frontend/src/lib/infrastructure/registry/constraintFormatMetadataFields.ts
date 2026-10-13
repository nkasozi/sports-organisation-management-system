import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";

export const COMPETITION_CONSTRAINT_COMPETITION_ID_FIELD: FieldMetadata = {
  field_name: "competition_id",
  display_name: "Competition",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "competition",
  show_in_list: true,
};

export const COMPETITION_CONSTRAINT_CONSTRAINT_TYPE_FIELD: FieldMetadata = {
  field_name: "constraint_type",
  display_name: "Constraint Type",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["game", "player", "team", "match"],
  show_in_list: true,
};

export const COMPETITION_CONSTRAINT_NAME_FIELD: FieldMetadata = {
  field_name: "name",
  display_name: "Constraint Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITION_CONSTRAINT_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description",
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const COMPETITION_CONSTRAINT_VALUE_TYPE_FIELD: FieldMetadata = {
  field_name: "value_type",
  display_name: "Value Type",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["number", "string", "boolean"],
};

export const COMPETITION_CONSTRAINT_VALUE_FIELD: FieldMetadata = {
  field_name: "value",
  display_name: "Value",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITION_CONSTRAINT_IS_MANDATORY_FIELD: FieldMetadata = {
  field_name: "is_mandatory",
  display_name: "Is Mandatory",
  field_type: "boolean",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITION_CONSTRAINT_APPLIES_TO_FIELD: FieldMetadata = {
  field_name: "applies_to",
  display_name: "Applies To",
  field_type: "string",
  is_required: true,
  is_read_only: false,
};

export const COMPETITIONFORMAT_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof CompetitionFormat,
  display_name: "Format Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONFORMAT_CODE_FIELD: FieldMetadata = {
  field_name: "code" satisfies keyof CompetitionFormat,
  display_name: "Code",
  field_type: "string",
  is_required: true,
  is_read_only: false,
};

export const COMPETITIONFORMAT_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof CompetitionFormat,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const COMPETITIONFORMAT_FORMAT_TYPE_FIELD: FieldMetadata = {
  field_name: "format_type" satisfies keyof CompetitionFormat,
  display_name: "Format Type",
  field_type: "enum",
  enum_values: [
    "league",
    "round_robin",
    "groups_knockout",
    "straight_knockout",
    "groups_playoffs",
    "double_elimination",
    "swiss",
    "custom",
  ],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONFORMAT_STAGE_TEMPLATES_FIELD: FieldMetadata = {
  field_name: "stage_templates" satisfies keyof CompetitionFormat,
  display_name: "Stage Template",
  field_type: "stage_template_array",
  is_required: true,
  is_read_only: false,
};

export const COMPETITIONFORMAT_MIN_TEAMS_REQUIRED_FIELD: FieldMetadata = {
  field_name: "min_teams_required" satisfies keyof CompetitionFormat,
  display_name: "Min Teams Required",
  field_type: "number",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONFORMAT_MAX_TEAMS_ALLOWED_FIELD: FieldMetadata = {
  field_name: "max_teams_allowed" satisfies keyof CompetitionFormat,
  display_name: "Max Teams Allowed",
  field_type: "number",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONFORMAT_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof CompetitionFormat,
  display_name: "Status",
  field_type: "enum",
  enum_values: ["active", "inactive", "archived"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONFORMAT_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof CompetitionFormat,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "organization",
  show_in_list: true,
};
