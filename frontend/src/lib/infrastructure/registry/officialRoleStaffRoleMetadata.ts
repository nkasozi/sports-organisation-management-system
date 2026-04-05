import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";

export function register_game_official_role_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("gameofficialrole", {
    entity_name: "gameofficialrole",
    display_name: "Game Official Role",
    fields: [
      {
        field_name: "name" satisfies keyof GameOfficialRole,
        display_name: "Role Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "code" satisfies keyof GameOfficialRole,
        display_name: "Code",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "description" satisfies keyof GameOfficialRole,
        display_name: "Description",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "sport_id" satisfies keyof GameOfficialRole,
        display_name: "Sport",
        field_type: "foreign_key",
        foreign_key_entity: "sport",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "is_on_field" satisfies keyof GameOfficialRole,
        display_name: "Is On Field",
        field_type: "boolean",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "is_head_official" satisfies keyof GameOfficialRole,
        display_name: "Is Head Official",
        field_type: "boolean",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "display_order" satisfies keyof GameOfficialRole,
        display_name: "Display Order",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "status" satisfies keyof GameOfficialRole,
        display_name: "Status",
        field_type: "enum",
        enum_values: ["active", "inactive", "archived"],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "organization_id" satisfies keyof GameOfficialRole,
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

export function register_team_staff_role_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("teamstaffrole", {
    entity_name: "teamstaffrole",
    display_name: "Team Staff Role",
    fields: [
      {
        field_name: "name" satisfies keyof TeamStaffRole,
        display_name: "Role Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "code" satisfies keyof TeamStaffRole,
        display_name: "Code",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "description" satisfies keyof TeamStaffRole,
        display_name: "Description",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "category" satisfies keyof TeamStaffRole,
        display_name: "Category",
        field_type: "enum",
        enum_values: [
          "coaching",
          "medical",
          "administrative",
          "technical",
          "other",
        ],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "is_primary_contact" satisfies keyof TeamStaffRole,
        display_name: "Is Primary Contact",
        field_type: "boolean",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "display_order" satisfies keyof TeamStaffRole,
        display_name: "Display Order",
        field_type: "number",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "status" satisfies keyof TeamStaffRole,
        display_name: "Status",
        field_type: "enum",
        enum_values: ["active", "inactive", "archived"],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "organization_id" satisfies keyof TeamStaffRole,
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
