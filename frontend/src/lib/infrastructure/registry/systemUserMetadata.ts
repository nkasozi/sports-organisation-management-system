import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { SystemUser } from "../../core/entities/SystemUser";

export function register_system_user_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("systemuser", {
    entity_name: "systemuser",
    display_name: "System User",
    fields: [
      {
        field_name: "role" satisfies keyof SystemUser,
        display_name: "Role",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: [
          "super_admin",
          "org_admin",
          "officials_manager",
          "team_manager",
          "official",
          "player",
        ],
        show_in_list: true,
      },
      {
        field_name: "email" satisfies keyof SystemUser,
        display_name: "Email",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "first_name" satisfies keyof SystemUser,
        display_name: "First Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "last_name" satisfies keyof SystemUser,
        display_name: "Last Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "organization_id" satisfies keyof SystemUser,
        display_name: "Organisation",
        field_type: "foreign_key",
        is_required: false,
        is_read_only: false,
        foreign_key_entity: "organization",
        show_in_list: true,
        visible_when: {
          depends_on_field: "role",
          visible_when_values: [
            "org_admin",
            "officials_manager",
            "team_manager",
            "official",
            "player",
          ],
        },
      },
      {
        field_name: "team_id" satisfies keyof SystemUser,
        display_name: "Team",
        field_type: "foreign_key",
        is_required: false,
        is_read_only: false,
        foreign_key_entity: "team",
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "teams_from_organization",
        },
        show_in_list: false,
        visible_when: {
          depends_on_field: "role",
          visible_when_values: ["team_manager"],
        },
      },
      {
        field_name: "player_id" satisfies keyof SystemUser,
        display_name: "Player",
        field_type: "foreign_key",
        is_required: false,
        is_read_only: false,
        foreign_key_entity: "player",
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "players_from_organization",
        },
        show_in_list: false,
        visible_when: {
          depends_on_field: "role",
          visible_when_values: ["player"],
        },
      },
      {
        field_name: "official_id" satisfies keyof SystemUser,
        display_name: "Official",
        field_type: "foreign_key",
        is_required: false,
        is_read_only: false,
        foreign_key_entity: "official",
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "officials_from_organization",
        },
        show_in_list: false,
        visible_when: {
          depends_on_field: "role",
          visible_when_values: ["official"],
        },
      },
      {
        field_name: "status" satisfies keyof SystemUser,
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
