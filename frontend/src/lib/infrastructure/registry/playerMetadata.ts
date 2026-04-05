import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Player } from "../../core/entities/Player";
import { get_country_names_sorted_unique } from "../utils/countries";

export function register_player_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("player", {
    entity_name: "player",
    display_name: "Player",
    fields: [
      {
        field_name: "organization_id" satisfies keyof Player,
        display_name: "Organization",
        field_type: "foreign_key",
        foreign_key_entity: "organization",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "first_name" satisfies keyof Player,
        display_name: "First Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        validation_rules: [
          {
            rule_type: "min_length",
            rule_value: 1,
            error_message: "First name is required",
          },
        ],
      },
      {
        field_name: "last_name" satisfies keyof Player,
        display_name: "Last Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        validation_rules: [
          {
            rule_type: "min_length",
            rule_value: 1,
            error_message: "Last name is required",
          },
        ],
      },
      {
        field_name: "gender_id" satisfies keyof Player,
        display_name: "Gender",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        foreign_key_entity: "gender",
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "lookup_from_organization",
        },
      },
      {
        field_name: "position_id" satisfies keyof Player,
        display_name: "Position",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        foreign_key_entity: "playerposition",
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "lookup_from_organization",
        },
      },
      {
        field_name: "date_of_birth" satisfies keyof Player,
        display_name: "Date of Birth",
        field_type: "date",
        is_required: true,
        is_read_only: false,
      },
      {
        field_name: "nationality" satisfies keyof Player,
        display_name: "Nationality",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: get_country_names_sorted_unique(),
        show_in_list: true,
      },
      {
        field_name: "email" satisfies keyof Player,
        display_name: "Email",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        validation_rules: [
          {
            rule_type: "pattern",
            rule_value: "^[^@]+@[^@]+\\.[^@]+$",
            error_message: "Must be a valid email",
          },
        ],
      },
      {
        field_name: "phone" satisfies keyof Player,
        display_name: "Phone",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "height_cm" satisfies keyof Player,
        display_name: "Height (cm)",
        field_type: "number",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "weight_kg" satisfies keyof Player,
        display_name: "Weight (kg)",
        field_type: "number",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "profile_image_url" satisfies keyof Player,
        display_name: "Profile Picture",
        field_type: "file",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "emergency_contact_name" satisfies keyof Player,
        display_name: "Emergency Contact Name",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "emergency_contact_phone" satisfies keyof Player,
        display_name: "Emergency Contact Phone",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "medical_notes" satisfies keyof Player,
        display_name: "Medical Notes",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "status" satisfies keyof Player,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive", "injured", "suspended"],
        show_in_list: true,
      },
      {
        field_name: "identifications",
        display_name: "Identity Documents",
        field_type: "sub_entity",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        sub_entity_config: {
          child_entity_type: "identification",
          foreign_key_field: "holder_id",
          holder_type_field: "holder_type",
          holder_type_value: "player",
        },
      },
    ],
  });
  return metadata_map;
}
