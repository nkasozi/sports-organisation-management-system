import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Official } from "../../core/entities/Official";

export function register_official_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("official", {
    entity_name: "official",
    display_name: "Official",
    fields: [
      {
        field_name: "organization_id" satisfies keyof Official,
        display_name: "Organization",
        field_type: "foreign_key",
        foreign_key_entity: "organization",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "first_name" satisfies keyof Official,
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
        field_name: "last_name" satisfies keyof Official,
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
        field_name: "gender_id" satisfies keyof Official,
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
        field_name: "email" satisfies keyof Official,
        display_name: "Email",
        field_type: "string",
        show_in_list: false,
        is_required: true,
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
        field_name: "phone" satisfies keyof Official,
        display_name: "Phone",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "years_of_experience" satisfies keyof Official,
        display_name: "Years Experience",
        field_type: "number",
        is_required: false,
        show_in_list: false,
        is_read_only: false,
        validation_rules: [
          {
            rule_type: "min_value",
            rule_value: 0,
            error_message: "Experience cannot be negative",
          },
        ],
      },
      {
        field_name: "emergency_contact_name" satisfies keyof Official,
        display_name: "Emergency Contact",
        field_type: "string",
        is_required: false,
        show_in_list: false,
        is_read_only: false,
      },
      {
        field_name: "emergency_contact_phone" satisfies keyof Official,
        display_name: "Emergency Contact Phone",
        field_type: "string",
        is_required: false,
        show_in_list: false,
        is_read_only: false,
      },
      {
        field_name: "date_of_birth" satisfies keyof Official,
        display_name: "Date of Birth",
        field_type: "date",
        is_required: false,
        show_in_list: false,
        is_read_only: false,
      },
      {
        field_name: "status" satisfies keyof Official,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        show_in_list: true,
        is_read_only: false,
        enum_values: ["active", "inactive"],
      },
      {
        field_name: "qualifications",
        display_name: "Qualifications & Certifications",
        field_type: "sub_entity",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        sub_entity_config: {
          child_entity_type: "qualification",
          foreign_key_field: "holder_id",
          holder_type_field: "holder_type",
          holder_type_value: "official",
        },
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
          holder_type_value: "official",
        },
      },
      {
        field_name: "associated_teams",
        display_name: "Associated Teams",
        field_type: "sub_entity",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        sub_entity_config: {
          child_entity_type: "officialassociatedteam",
          foreign_key_field: "official_id",
        },
      },
    ],
  });
  return metadata_map;
}
