import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Team } from "../../core/entities/Team";

export function register_team_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("team", {
    entity_name: "team",
    display_name: "Team",
    fields: [
      {
        field_name: "name" satisfies keyof Team,
        display_name: "Team Name",
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
        field_name: "organization_id" satisfies keyof Team,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        foreign_key_entity: "organization",
        show_in_list: true,
      },
      {
        field_name: "gender_id" satisfies keyof Team,
        display_name: "Team Gender Category",
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
        field_name: "short_name" satisfies keyof Team,
        display_name: "Team Code",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        validation_rules: [
          {
            rule_type: "min_length",
            rule_value: 2,
            error_message: "Team code must be at least 2 characters",
          },
        ],
      },
      {
        field_name: "founded_year" satisfies keyof Team,
        display_name: "Established Year",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
        validation_rules: [
          {
            rule_type: "min_value",
            rule_value: 1800,
            error_message: "Year must be realistic",
          },
        ],
      },
      {
        field_name: "home_venue_id" satisfies keyof Team,
        display_name: "Home Venue",
        field_type: "foreign_key",
        foreign_key_entity: "venue",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "primary_color" satisfies keyof Team,
        display_name: "Team Color",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "logo_url" satisfies keyof Team,
        display_name: "Team Logo",
        field_type: "file",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "status" satisfies keyof Team,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive", "disqualified"],
        show_in_list: true,
      },
      {
        field_name: "jersey_colors",
        display_name: "Jersey Colors",
        field_type: "sub_entity",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        sub_entity_config: {
          child_entity_type: "jerseycolor",
          foreign_key_field: "holder_id",
          holder_type_field: "holder_type",
          holder_type_value: "team",
        },
      },
    ],
  });
  return metadata_map;
}
