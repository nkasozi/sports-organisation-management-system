import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Venue } from "../../core/entities/Venue";
import { get_country_names_sorted_unique } from "../utils/countries";

export function register_venue_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("venue", {
    entity_name: "venue",
    display_name: "Venue",
    fields: [
      {
        field_name: "organization_id" satisfies keyof Venue,
        display_name: "Organization",
        field_type: "foreign_key",
        foreign_key_entity: "organization",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "name" satisfies keyof Venue,
        display_name: "Venue Name",
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
      },
      {
        field_name: "short_name" satisfies keyof Venue,
        display_name: "Short Name",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "address" satisfies keyof Venue,
        display_name: "Address",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "city" satisfies keyof Venue,
        display_name: "City",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "country" satisfies keyof Venue,
        display_name: "Country",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: get_country_names_sorted_unique(),
        show_in_list: true,
      },
      {
        field_name: "capacity" satisfies keyof Venue,
        display_name: "Capacity",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
        validation_rules: [
          {
            rule_type: "min_value",
            rule_value: 0,
            error_message: "Capacity cannot be negative",
          },
        ],
      },
      {
        field_name: "surface_type" satisfies keyof Venue,
        display_name: "Surface Type",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: [
          "grass",
          "artificial_turf",
          "indoor",
          "clay",
          "concrete",
          "other",
        ],
        show_in_list: false,
      },
      {
        field_name: "has_lighting" satisfies keyof Venue,
        display_name: "Has Lighting",
        field_type: "boolean",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "has_parking" satisfies keyof Venue,
        display_name: "Has Parking",
        field_type: "boolean",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "contact_email" satisfies keyof Venue,
        display_name: "Contact Email",
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
        field_name: "contact_phone" satisfies keyof Venue,
        display_name: "Contact Phone",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "website" satisfies keyof Venue,
        display_name: "Website",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "image_url" satisfies keyof Venue,
        display_name: "Venue Image",
        field_type: "file",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "status" satisfies keyof Venue,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive", "archived"],
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}
