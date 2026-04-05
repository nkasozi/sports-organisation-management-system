import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Identification } from "../../core/entities/Identification";
import type { JerseyColor } from "../../core/entities/JerseyColor";

export function register_identification_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("identification", {
    entity_name: "identification",
    display_name: "Identification",
    fields: [
      {
        field_name: "holder_type" satisfies keyof Identification,
        display_name: "Holder Type",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        enum_values: ["player", "team_staff", "official"],
      },
      {
        field_name: "holder_id" satisfies keyof Identification,
        display_name: "Holder ID",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "identification_type_id" satisfies keyof Identification,
        display_name: "Identification Type",
        field_type: "foreign_key",
        foreign_key_entity: "identificationtype",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "identifier_value" satisfies keyof Identification,
        display_name: "ID Number",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "document_image_url" satisfies keyof Identification,
        display_name: "Document Image",
        field_type: "file",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "issue_date" satisfies keyof Identification,
        display_name: "Issue Date",
        field_type: "date",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "expiry_date" satisfies keyof Identification,
        display_name: "Expiry Date",
        field_type: "date",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "notes" satisfies keyof Identification,
        display_name: "Notes",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "status" satisfies keyof Identification,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive"],
        show_in_list: true,
      },
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
      {
        field_name: "holder_type" satisfies keyof JerseyColor,
        display_name: "Holder Type",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
        enum_values: ["team", "official"],
      },
      {
        field_name: "holder_id" satisfies keyof JerseyColor,
        display_name: "Holder ID",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "nickname" satisfies keyof JerseyColor,
        display_name: "Jersey Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "main_color" satisfies keyof JerseyColor,
        display_name: "Main Color",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "secondary_color" satisfies keyof JerseyColor,
        display_name: "Secondary Color",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "tertiary_color" satisfies keyof JerseyColor,
        display_name: "Tertiary Color",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "status" satisfies keyof JerseyColor,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive"],
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}
