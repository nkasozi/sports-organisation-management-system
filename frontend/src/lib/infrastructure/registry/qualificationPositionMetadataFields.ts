import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { Qualification } from "../../core/entities/Qualification";

export const PLAYERPOSITION_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof PlayerPosition,
  display_name: "Position Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const PLAYERPOSITION_CODE_FIELD: FieldMetadata = {
  field_name: "code" satisfies keyof PlayerPosition,
  display_name: "Code",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const PLAYERPOSITION_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof PlayerPosition,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const PLAYERPOSITION_CATEGORY_FIELD: FieldMetadata = {
  field_name: "category" satisfies keyof PlayerPosition,
  display_name: "Category",
  field_type: "enum",
  enum_values: ["offense", "defense", "goalkeeper", "utility", "other"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const PLAYERPOSITION_DISPLAY_ORDER_FIELD: FieldMetadata = {
  field_name: "display_order" satisfies keyof PlayerPosition,
  display_name: "Display Order",
  field_type: "number",
  is_required: false,
  is_read_only: false,
};

export const PLAYERPOSITION_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof PlayerPosition,
  display_name: "Status",
  field_type: "enum",
  enum_values: ["active", "inactive", "archived"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const PLAYERPOSITION_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof PlayerPosition,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "organization",
  show_in_list: true,
};

export const QUALIFICATION_HOLDER_TYPE_FIELD: FieldMetadata = {
  field_name: "holder_type" satisfies keyof Qualification,
  display_name: "Holder Type",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  enum_values: ["official", "team_staff"],
};

export const QUALIFICATION_HOLDER_ID_FIELD: FieldMetadata = {
  field_name: "holder_id" satisfies keyof Qualification,
  display_name: "Holder ID",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const QUALIFICATION_CERTIFICATION_NAME_FIELD: FieldMetadata = {
  field_name: "certification_name" satisfies keyof Qualification,
  display_name: "Certification Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const QUALIFICATION_CERTIFICATION_LEVEL_FIELD: FieldMetadata = {
  field_name: "certification_level" satisfies keyof Qualification,
  display_name: "Certification Level",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  enum_values: [
    "trainee",
    "local",
    "regional",
    "national",
    "international",
    "fifa",
    "other",
  ],
};

export const QUALIFICATION_CERTIFICATION_NUMBER_FIELD: FieldMetadata = {
  field_name: "certification_number" satisfies keyof Qualification,
  display_name: "Certification Number",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const QUALIFICATION_ISSUING_AUTHORITY_FIELD: FieldMetadata = {
  field_name: "issuing_authority" satisfies keyof Qualification,
  display_name: "Issuing Authority",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const QUALIFICATION_ISSUE_DATE_FIELD: FieldMetadata = {
  field_name: "issue_date" satisfies keyof Qualification,
  display_name: "Issue Date",
  field_type: "date",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const QUALIFICATION_EXPIRY_DATE_FIELD: FieldMetadata = {
  field_name: "expiry_date" satisfies keyof Qualification,
  display_name: "Expiry Date",
  field_type: "date",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const QUALIFICATION_SPECIALIZATIONS_FIELD: FieldMetadata = {
  field_name: "specializations" satisfies keyof Qualification,
  display_name: "Specializations",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const QUALIFICATION_NOTES_FIELD: FieldMetadata = {
  field_name: "notes" satisfies keyof Qualification,
  display_name: "Notes",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const QUALIFICATION_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof Qualification,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive"],
  show_in_list: true,
};
