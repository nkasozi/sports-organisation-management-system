import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";

export const GAMEOFFICIALROLE_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof GameOfficialRole,
  display_name: "Role Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEOFFICIALROLE_CODE_FIELD: FieldMetadata = {
  field_name: "code" satisfies keyof GameOfficialRole,
  display_name: "Code",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEOFFICIALROLE_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof GameOfficialRole,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const GAMEOFFICIALROLE_SPORT_ID_FIELD: FieldMetadata = {
  field_name: "sport_id" satisfies keyof GameOfficialRole,
  display_name: "Sport",
  field_type: "foreign_key",
  foreign_key_entity: "sport",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEOFFICIALROLE_IS_ON_FIELD_FIELD: FieldMetadata = {
  field_name: "is_on_field" satisfies keyof GameOfficialRole,
  display_name: "Is On Field",
  field_type: "boolean",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEOFFICIALROLE_IS_HEAD_OFFICIAL_FIELD: FieldMetadata = {
  field_name: "is_head_official" satisfies keyof GameOfficialRole,
  display_name: "Is Head Official",
  field_type: "boolean",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const GAMEOFFICIALROLE_IS_TABLE_OFFICIAL_FIELD: FieldMetadata = {
  field_name: "is_table_official" satisfies keyof GameOfficialRole,
  display_name: "Runs the Live Game (Table Official)",
  field_type: "boolean",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEOFFICIALROLE_DISPLAY_ORDER_FIELD: FieldMetadata = {
  field_name: "display_order" satisfies keyof GameOfficialRole,
  display_name: "Display Order",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const GAMEOFFICIALROLE_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof GameOfficialRole,
  display_name: "Status",
  field_type: "enum",
  enum_values: ["active", "inactive", "archived"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEOFFICIALROLE_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof GameOfficialRole,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "organization",
  show_in_list: true,
};

export const TEAMSTAFFROLE_NAME_FIELD: FieldMetadata = {
  field_name: "name" satisfies keyof TeamStaffRole,
  display_name: "Role Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const TEAMSTAFFROLE_CODE_FIELD: FieldMetadata = {
  field_name: "code" satisfies keyof TeamStaffRole,
  display_name: "Code",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const TEAMSTAFFROLE_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof TeamStaffRole,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

export const TEAMSTAFFROLE_CATEGORY_FIELD: FieldMetadata = {
  field_name: "category" satisfies keyof TeamStaffRole,
  display_name: "Category",
  field_type: "enum",
  enum_values: ["coaching", "medical", "administrative", "technical", "other"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const TEAMSTAFFROLE_IS_PRIMARY_CONTACT_FIELD: FieldMetadata = {
  field_name: "is_primary_contact" satisfies keyof TeamStaffRole,
  display_name: "Is Primary Contact",
  field_type: "boolean",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const TEAMSTAFFROLE_DISPLAY_ORDER_FIELD: FieldMetadata = {
  field_name: "display_order" satisfies keyof TeamStaffRole,
  display_name: "Display Order",
  field_type: "number",
  is_required: false,
  is_read_only: false,
};

export const TEAMSTAFFROLE_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof TeamStaffRole,
  display_name: "Status",
  field_type: "enum",
  enum_values: ["active", "inactive", "archived"],
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const TEAMSTAFFROLE_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof TeamStaffRole,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "organization",
  show_in_list: true,
};
