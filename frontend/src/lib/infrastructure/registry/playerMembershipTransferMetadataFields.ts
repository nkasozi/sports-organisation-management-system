import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";
import type { PlayerTeamTransferHistory } from "../../core/entities/PlayerTeamTransferHistory";

export const PLAYERTEAMMEMBERSHIP_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof PlayerTeamMembership,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  is_read_only_on_edit: true,
  foreign_key_entity: "organization",
};

export const PLAYERTEAMMEMBERSHIP_PLAYER_ID_FIELD: FieldMetadata = {
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
};

export const PLAYERTEAMMEMBERSHIP_TEAM_ID_FIELD: FieldMetadata = {
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
};

export const PLAYERTEAMMEMBERSHIP_START_DATE_FIELD: FieldMetadata = {
  field_name: "start_date" satisfies keyof PlayerTeamMembership,
  display_name: "Start Date",
  field_type: "date",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const PLAYERTEAMMEMBERSHIP_JERSEY_NUMBER_FIELD: FieldMetadata = {
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
};

export const PLAYERTEAMMEMBERSHIP_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof PlayerTeamMembership,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive", "ended"],
  show_in_list: true,
};

export const PLAYERTEAMTRANSFERHISTORY_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof PlayerTeamTransferHistory,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  is_read_only_on_edit: true,
  foreign_key_entity: "organization",
};

export const PLAYERTEAMTRANSFERHISTORY_PLAYER_ID_FIELD: FieldMetadata = {
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
};

export const PLAYERTEAMTRANSFERHISTORY_FROM_TEAM_ID_FIELD: FieldMetadata = {
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
};

export const PLAYERTEAMTRANSFERHISTORY_TO_TEAM_ID_FIELD: FieldMetadata = {
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
};

export const PLAYERTEAMTRANSFERHISTORY_TRANSFER_DATE_FIELD: FieldMetadata = {
  field_name: "transfer_date" satisfies keyof PlayerTeamTransferHistory,
  display_name: "Transfer Date",
  field_type: "date",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
  hide_on_create: true,
  hide_on_edit: true,
};

export const PLAYERTEAMTRANSFERHISTORY_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof PlayerTeamTransferHistory,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  is_read_only_on_create: true,
  enum_values: ["pending", "approved", "declined"],
  show_in_list: true,
};

export const PLAYERTEAMTRANSFERHISTORY_APPROVED_BY_FIELD: FieldMetadata = {
  field_name: "approved_by" satisfies keyof PlayerTeamTransferHistory,
  display_name: "Approved By",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
  hide_on_create: true,
  hide_on_edit: true,
};

export const PLAYERTEAMTRANSFERHISTORY_NOTES_FIELD: FieldMetadata = {
  field_name: "notes" satisfies keyof PlayerTeamTransferHistory,
  display_name: "Notes",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};
