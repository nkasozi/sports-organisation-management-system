import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { Competition } from "../../core/entities/Competition";
import type { Organization } from "../../core/entities/Organization";

export const ORGANIZATION_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof Organization,
  display_name: "Organization Name",
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

export const ORGANIZATION_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof Organization,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const ORGANIZATION_SPORT_ID_FIELD: FieldMetadata = {
  field_name: "sport_id" satisfies keyof Organization,
  display_name: "Sport",
  field_type: "foreign_key",
  foreign_key_entity: "sport",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const ORGANIZATION_FOUNDED_DATE_FIELD: FieldMetadata = {
  field_name: "founded_date" satisfies keyof Organization,
  display_name: "Founded Date",
  field_type: "date",
  is_required: false,
  is_read_only: false,
};

export const ORGANIZATION_CONTACT_EMAIL_FIELD: FieldMetadata = {
  field_name: "contact_email" satisfies keyof Organization,
  display_name: "Contact Email",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
  validation_rules: [
    {
      rule_type: "pattern",
      rule_value: "^[^@]+@[^@]+\\.[^@]+$",
      error_message: "Must be a valid email",
    },
  ],
};

export const ORGANIZATION_CONTACT_PHONE_FIELD: FieldMetadata = {
  field_name: "contact_phone" satisfies keyof Organization,
  display_name: "Contact Phone",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const ORGANIZATION_ADDRESS_FIELD: FieldMetadata = {
  field_name: "address" satisfies keyof Organization,
  display_name: "Address",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const ORGANIZATION_WEBSITE_FIELD: FieldMetadata = {
  field_name: "website" satisfies keyof Organization,
  display_name: "Website",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const ORGANIZATION_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof Organization,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive", "suspended"],
  show_in_list: true,
};

export const COMPETITION_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof Competition,
  display_name: "Competition Name",
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

export const COMPETITION_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof Competition,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const COMPETITION_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof Competition,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "organization",
  show_in_list: true,
};

export const COMPETITION_START_DATE_FIELD: FieldMetadata = {
  field_name: "start_date" satisfies keyof Competition,
  display_name: "Start Date",
  field_type: "date",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITION_END_DATE_FIELD: FieldMetadata = {
  field_name: "end_date" satisfies keyof Competition,
  display_name: "End Date",
  field_type: "date",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const COMPETITION_MAX_TEAMS_FIELD: FieldMetadata = {
  field_name: "max_teams" satisfies keyof Competition,
  display_name: "Maximum Teams",
  field_type: "number",
  is_required: true,
  is_read_only: false,
  validation_rules: [
    {
      rule_type: "min_value",
      rule_value: 2,
      error_message: "Must allow at least 2 teams",
    },
  ],
};

export const COMPETITION_REGISTRATION_DEADLINE_FIELD: FieldMetadata = {
  field_name: "registration_deadline" satisfies keyof Competition,
  display_name: "Registration Deadline",
  field_type: "date",
  is_required: true,
  is_read_only: false,
};

export const COMPETITION_OFFICIAL_JERSEY_COLORS_FIELD: FieldMetadata = {
  field_name: "official_jersey_colors",
  display_name: "Official Jersey Colors",
  field_type: "sub_entity",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
  sub_entity_config: {
    child_entity_type: "jerseycolor",
    foreign_key_field: "holder_id",
    holder_type_field: "holder_type",
    holder_type_value: "competition_official",
  },
};
