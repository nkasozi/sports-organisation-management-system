import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";
import type { PlayerTeamTransferHistory } from "../../core/entities/PlayerTeamTransferHistory";

export function register_player_team_membership_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("playerteammembership", {
    entity_name: "playerteammembership",
    display_name: "Player Team Membership",
    fields: [
      {
        field_name: "organization_id" satisfies keyof PlayerTeamMembership,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "organization",
      },
      {
        field_name: "player_id" satisfies keyof PlayerTeamMembership,
        display_name: "Player",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "player",
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "players_from_organization",
        },
      },
      {
        field_name: "team_id" satisfies keyof PlayerTeamMembership,
        display_name: "Team",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "team",
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "teams_from_organization",
        },
      },
      {
        field_name: "start_date" satisfies keyof PlayerTeamMembership,
        display_name: "Start Date",
        field_type: "date",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "jersey_number" satisfies keyof PlayerTeamMembership,
        display_name: "Jersey Number",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
        validation_rules: [
          {
            rule_type: "min_value",
            rule_value: 1,
            error_message: "Jersey number must be positive",
          },
          {
            rule_type: "max_value",
            rule_value: 99,
            error_message: "Jersey number must be under 100",
          },
        ],
      },
      {
        field_name: "status" satisfies keyof PlayerTeamMembership,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive", "ended"],
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}

export function register_player_team_transfer_history_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("playerteamtransferhistory", {
    entity_name: "playerteamtransferhistory",
    display_name: "Player Transfer",
    fields: [
      {
        field_name: "organization_id" satisfies keyof PlayerTeamTransferHistory,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "organization",
      },
      {
        field_name: "player_id" satisfies keyof PlayerTeamTransferHistory,
        display_name: "Player",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "player",
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "players_from_organization",
        },
      },
      {
        field_name: "from_team_id" satisfies keyof PlayerTeamTransferHistory,
        display_name: "From Team",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "team",
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "player_id",
          filter_type: "teams_from_player_memberships",
        },
      },
      {
        field_name: "to_team_id" satisfies keyof PlayerTeamTransferHistory,
        display_name: "To Team",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "team",
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "player_id",
          filter_type: "teams_excluding_player_memberships",
        },
      },
      {
        field_name: "transfer_date" satisfies keyof PlayerTeamTransferHistory,
        display_name: "Transfer Date",
        field_type: "date",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
        hide_on_create: true,
        hide_on_edit: true,
      },
      {
        field_name: "status" satisfies keyof PlayerTeamTransferHistory,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        is_read_only_on_create: true,
        enum_values: ["pending", "approved", "declined"],
        show_in_list: true,
      },
      {
        field_name: "approved_by" satisfies keyof PlayerTeamTransferHistory,
        display_name: "Approved By",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        hide_on_create: true,
        hide_on_edit: true,
      },
      {
        field_name: "notes" satisfies keyof PlayerTeamTransferHistory,
        display_name: "Notes",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
    ],
  });
  return metadata_map;
}
