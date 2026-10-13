import type {
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { Identification } from "../../core/entities/Identification";
import type { JerseyColor } from "../../core/entities/JerseyColor";

const IDENTIFICATION_HOLDER_TYPE_FIELD: FieldMetadata = {
  field_name: "holder_type" satisfies keyof Identification,
  display_name: "Holder Type",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  enum_values: ["player", "team_staff", "official"],
};

const IDENTIFICATION_HOLDER_ID_FIELD: FieldMetadata = {
  field_name: "holder_id" satisfies keyof Identification,
  display_name: "Holder ID",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

const IDENTIFICATION_IDENTIFICATION_TYPE_ID_FIELD: FieldMetadata = {
  field_name: "identification_type_id" satisfies keyof Identification,
  display_name: "Identification Type",
  field_type: "foreign_key",
  foreign_key_entity: "identificationtype",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

const IDENTIFICATION_IDENTIFIER_VALUE_FIELD: FieldMetadata = {
  field_name: "identifier_value" satisfies keyof Identification,
  display_name: "ID Number",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

const IDENTIFICATION_DOCUMENT_IMAGE_URL_FIELD: FieldMetadata = {
  field_name: "document_image_url" satisfies keyof Identification,
  display_name: "Document Image",
  field_type: "file",
  is_required: false,
  is_read_only: false,
};

const IDENTIFICATION_ISSUE_DATE_FIELD: FieldMetadata = {
  field_name: "issue_date" satisfies keyof Identification,
  display_name: "Issue Date",
  field_type: "date",
  is_required: false,
  is_read_only: false,
};

const IDENTIFICATION_EXPIRY_DATE_FIELD: FieldMetadata = {
  field_name: "expiry_date" satisfies keyof Identification,
  display_name: "Expiry Date",
  field_type: "date",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

const IDENTIFICATION_NOTES_FIELD: FieldMetadata = {
  field_name: "notes" satisfies keyof Identification,
  display_name: "Notes",
  field_type: "string",
  is_required: false,
  is_read_only: false,
};

const IDENTIFICATION_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof Identification,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive"],
  show_in_list: true,
};

const JERSEYCOLOR_HOLDER_TYPE_FIELD: FieldMetadata = {
  field_name: "holder_type" satisfies keyof JerseyColor,
  display_name: "Holder Type",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
  enum_values: ["team", "official"],
};

const JERSEYCOLOR_HOLDER_ID_FIELD: FieldMetadata = {
  field_name: "holder_id" satisfies keyof JerseyColor,
  display_name: "Holder ID",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

const JERSEYCOLOR_NICKNAME_FIELD: FieldMetadata = {
  field_name: "nickname" satisfies keyof JerseyColor,
  display_name: "Jersey Name",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

const JERSEYCOLOR_MAIN_COLOR_FIELD: FieldMetadata = {
  field_name: "main_color" satisfies keyof JerseyColor,
  display_name: "Main Color",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

const JERSEYCOLOR_SECONDARY_COLOR_FIELD: FieldMetadata = {
  field_name: "secondary_color" satisfies keyof JerseyColor,
  display_name: "Secondary Color",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

const JERSEYCOLOR_TERTIARY_COLOR_FIELD: FieldMetadata = {
  field_name: "tertiary_color" satisfies keyof JerseyColor,
  display_name: "Tertiary Color",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

const JERSEYCOLOR_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof JerseyColor,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive"],
  show_in_list: true,
};

export function register_identification_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("identification", {
    entity_name: "identification",
    display_name: "Identification",
    fields: [
      IDENTIFICATION_HOLDER_TYPE_FIELD,
      IDENTIFICATION_HOLDER_ID_FIELD,
      IDENTIFICATION_IDENTIFICATION_TYPE_ID_FIELD,
      IDENTIFICATION_IDENTIFIER_VALUE_FIELD,
      IDENTIFICATION_DOCUMENT_IMAGE_URL_FIELD,
      IDENTIFICATION_ISSUE_DATE_FIELD,
      IDENTIFICATION_EXPIRY_DATE_FIELD,
      IDENTIFICATION_NOTES_FIELD,
      IDENTIFICATION_STATUS_FIELD,
    ],
  });
  return metadata_map;
}

export function register_jersey_color_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("jerseycolor", {
    entity_name: "jerseycolor",
    display_name: "Jersey Color",
    fields: [
      JERSEYCOLOR_HOLDER_TYPE_FIELD,
      JERSEYCOLOR_HOLDER_ID_FIELD,
      JERSEYCOLOR_NICKNAME_FIELD,
      JERSEYCOLOR_MAIN_COLOR_FIELD,
      JERSEYCOLOR_SECONDARY_COLOR_FIELD,
      JERSEYCOLOR_TERTIARY_COLOR_FIELD,
      JERSEYCOLOR_STATUS_FIELD,
    ],
  });
  return metadata_map;
}
