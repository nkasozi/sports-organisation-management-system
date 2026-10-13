import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { CompetitionStage } from "../../core/entities/CompetitionStage";
import type { Gender } from "../../core/entities/Gender";
import type { IdentificationType } from "../../core/entities/IdentificationType";

export const COMPETITIONSTAGE_COMPETITION_ID_FIELD: FieldMetadata = {
  field_name: "competition_id" satisfies keyof CompetitionStage,
  display_name: "Competition",
  field_type: "foreign_key",
  foreign_key_entity: "competition",
  is_required: true,
  is_read_only: false,
  is_read_only_on_edit: true,
  show_in_list: false,
};

export const COMPETITIONSTAGE_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof CompetitionStage,
  display_name: "Stage Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONSTAGE_STAGE_TYPE_FIELD: FieldMetadata = {
  field_name: "stage_type" satisfies keyof CompetitionStage,
  display_name: "Stage Type",
  field_type: "enum",
  enum_values: [
    "group_stage",
    "knockout_stage",
    "league_stage",
    "one_off_stage",
    "custom",
  ],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONSTAGE_STAGE_ORDER_FIELD: FieldMetadata = {
  field_name: "stage_order" satisfies keyof CompetitionStage,
  display_name: "Stage Order",
  field_type: "number",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITIONSTAGE_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof CompetitionStage,
  display_name: "Status",
  field_type: "enum",
  enum_values: ["active", "inactive", "archived"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const IDENTIFICATIONTYPE_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof IdentificationType,
  display_name: "Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  validation_rules: [
    {
      rule_type: "min_length",
      rule_value: 2,
      error_message: "Name must be at least 2 characters",
    },
  ],
};

export const IDENTIFICATIONTYPE_IDENTIFIER_FIELD_LABEL_FIELD: FieldMetadata = {
  field_name: "identifier_field_label" satisfies keyof IdentificationType,
  display_name: "Identifier Field Label",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  validation_rules: [
    {
      rule_type: "min_length",
      rule_value: 2,
      error_message: "Identifier field label must be at least 2 characters",
    },
  ],
};

export const IDENTIFICATIONTYPE_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof IdentificationType,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const IDENTIFICATIONTYPE_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof IdentificationType,
  display_name: "Status",
  field_type: "enum",
  enum_values: ["active", "inactive"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const IDENTIFICATIONTYPE_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof IdentificationType,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "organization",
  show_in_list: true,
};

export const GENDER_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof Gender,
  display_name: "Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  validation_rules: [
    {
      rule_type: "min_length",
      rule_value: 2,
      error_message: "Name must be at least 2 characters",
    },
  ],
};

export const GENDER_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof Gender,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const GENDER_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof Gender,
  display_name: "Status",
  field_type: "enum",
  enum_values: ["active", "inactive"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const GENDER_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof Gender,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "organization",
  show_in_list: true,
};
