import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";

export function register_competition_constraint_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("competition_constraint", {
    entity_name: "competition_constraint",
    display_name: "Competition Constraint",
    fields: [
      {
        field_name: "competition_id",
        display_name: "Competition",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        foreign_key_entity: "competition",
        show_in_list: true,
      },
      {
        field_name: "constraint_type",
        display_name: "Constraint Type",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["game", "player", "team", "match"],
        show_in_list: true,
      },
      {
        field_name: "name",
        display_name: "Constraint Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "description",
        display_name: "Description",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "value_type",
        display_name: "Value Type",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["number", "string", "boolean"],
      },
      {
        field_name: "value",
        display_name: "Value",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "is_mandatory",
        display_name: "Is Mandatory",
        field_type: "boolean",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "applies_to",
        display_name: "Applies To",
        field_type: "string",
        is_required: true,
        is_read_only: false,
      },
    ],
  });
  return metadata_map;
}

export function register_competition_format_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("competitionformat", {
    entity_name: "competitionformat",
    display_name: "Competition Format",
    fields: [
      {
        field_name: "name" satisfies keyof CompetitionFormat,
        display_name: "Format Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "code" satisfies keyof CompetitionFormat,
        display_name: "Code",
        field_type: "string",
        is_required: true,
        is_read_only: false,
      },
      {
        field_name: "description" satisfies keyof CompetitionFormat,
        display_name: "Description",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "format_type" satisfies keyof CompetitionFormat,
        display_name: "Format Type",
        field_type: "enum",
        enum_values: [
          "league",
          "round_robin",
          "groups_knockout",
          "straight_knockout",
          "groups_playoffs",
          "double_elimination",
          "swiss",
          "custom",
        ],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "stage_templates" satisfies keyof CompetitionFormat,
        display_name: "Stage Template",
        field_type: "stage_template_array",
        is_required: true,
        is_read_only: false,
      },
      {
        field_name: "min_teams_required" satisfies keyof CompetitionFormat,
        display_name: "Min Teams Required",
        field_type: "number",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "max_teams_allowed" satisfies keyof CompetitionFormat,
        display_name: "Max Teams Allowed",
        field_type: "number",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "status" satisfies keyof CompetitionFormat,
        display_name: "Status",
        field_type: "enum",
        enum_values: ["active", "inactive", "archived"],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "organization_id" satisfies keyof CompetitionFormat,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        foreign_key_entity: "organization",
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}
