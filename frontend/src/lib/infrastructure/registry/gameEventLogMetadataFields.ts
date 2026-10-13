import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { GameEventLog } from "../../core/entities/GameEventLog";
import {
  GAME_EVENT_TYPE_OPTIONS,
  TEAM_SIDE_OPTIONS,
} from "../../core/entities/GameEventLog";

export const GAMEEVENTLOG_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof GameEventLog,
  display_name: "Organization",
  field_type: "foreign_key",
  foreign_key_entity: "organization",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const GAMEEVENTLOG_LIVE_GAME_LOG_ID_FIELD: FieldMetadata = {
  field_name: "live_game_log_id" satisfies keyof GameEventLog,
  display_name: "Live Game",
  field_type: "foreign_key",
  foreign_key_entity: "livegamelog",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  foreign_key_filter: {
    depends_on_field: "organization_id",
    filter_type: "live_game_logs_from_organization",
  },
};

export const GAMEEVENTLOG_FIXTURE_ID_FIELD: FieldMetadata = {
  field_name: "fixture_id" satisfies keyof GameEventLog,
  display_name: "Fixture",
  field_type: "foreign_key",
  foreign_key_entity: "fixture",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
  foreign_key_filter: {
    depends_on_field: "organization_id",
    filter_type: "fixtures_from_organization",
  },
};

export const GAMEEVENTLOG_EVENT_TYPE_FIELD: FieldMetadata = {
  field_name: "event_type" satisfies keyof GameEventLog,
  display_name: "Event Type",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  enum_options: GAME_EVENT_TYPE_OPTIONS,
};

export const GAMEEVENTLOG_MINUTE_FIELD: FieldMetadata = {
  field_name: "minute" satisfies keyof GameEventLog,
  display_name: "Minute",
  field_type: "number",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEEVENTLOG_STOPPAGE_TIME_MINUTE_FIELD: FieldMetadata = {
  field_name: "stoppage_time_minute" satisfies keyof GameEventLog,
  display_name: "Stoppage Time Minute",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const GAMEEVENTLOG_TEAM_SIDE_FIELD: FieldMetadata = {
  field_name: "team_side" satisfies keyof GameEventLog,
  display_name: "Team Side",
  field_type: "enum",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
  enum_options: TEAM_SIDE_OPTIONS,
};

export const GAMEEVENTLOG_PLAYER_ID_FIELD: FieldMetadata = {
  field_name: "player_id" satisfies keyof GameEventLog,
  display_name: "Player",
  field_type: "foreign_key",
  foreign_key_entity: "player",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
  foreign_key_filter: {
    depends_on_field: "organization_id",
    filter_type: "players_from_organization",
  },
};

export const GAMEEVENTLOG_PLAYER_NAME_FIELD: FieldMetadata = {
  field_name: "player_name" satisfies keyof GameEventLog,
  display_name: "Player Name",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEEVENTLOG_SECONDARY_PLAYER_ID_FIELD: FieldMetadata = {
  field_name: "secondary_player_id" satisfies keyof GameEventLog,
  display_name: "Secondary Player",
  field_type: "foreign_key",
  foreign_key_entity: "player",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
  foreign_key_filter: {
    depends_on_field: "organization_id",
    filter_type: "players_from_organization",
  },
};

export const GAMEEVENTLOG_SECONDARY_PLAYER_NAME_FIELD: FieldMetadata = {
  field_name: "secondary_player_name" satisfies keyof GameEventLog,
  display_name: "Secondary Player Name",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const GAMEEVENTLOG_DESCRIPTION_FIELD: FieldMetadata = {
  field_name: "description" satisfies keyof GameEventLog,
  display_name: "Description",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

export const GAMEEVENTLOG_AFFECTS_SCORE_FIELD: FieldMetadata = {
  field_name: "affects_score" satisfies keyof GameEventLog,
  display_name: "Affects Score",
  field_type: "boolean",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const GAMEEVENTLOG_VOIDED_FIELD: FieldMetadata = {
  field_name: "voided" satisfies keyof GameEventLog,
  display_name: "Voided",
  field_type: "boolean",
  is_required: false,
  is_read_only: true,
  show_in_list: true,
};

export const GAMEEVENTLOG_VOIDED_REASON_FIELD: FieldMetadata = {
  field_name: "voided_reason" satisfies keyof GameEventLog,
  display_name: "Voided Reason",
  field_type: "string",
  is_required: false,
  is_read_only: true,
  show_in_list: false,
};

export const GAMEEVENTLOG_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof GameEventLog,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive", "archived"],
  show_in_list: true,
};
