import type {
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { LiveGameLog } from "../../core/entities/LiveGameLog";
import {
  LIVE_GAME_PERIOD_OPTIONS,
  LIVE_GAME_STATUS_OPTIONS,
} from "../../core/entities/LiveGameLog";

const LIVEGAMELOG_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof LiveGameLog,
  display_name: "Organization",
  field_type: "foreign_key",
  foreign_key_entity: "organization",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

const LIVEGAMELOG_FIXTURE_ID_FIELD: FieldMetadata = {
  field_name: "fixture_id" satisfies keyof LiveGameLog,
  display_name: "Fixture",
  field_type: "foreign_key",
  foreign_key_entity: "fixture",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  foreign_key_filter: {
    depends_on_field: "organization_id",
    filter_type: "fixtures_from_organization",
  },
};

const LIVEGAMELOG_HOME_LINEUP_ID_FIELD: FieldMetadata = {
  field_name: "home_lineup_id" satisfies keyof LiveGameLog,
  display_name: "Home Lineup",
  field_type: "foreign_key",
  foreign_key_entity: "fixturelineup",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

const LIVEGAMELOG_AWAY_LINEUP_ID_FIELD: FieldMetadata = {
  field_name: "away_lineup_id" satisfies keyof LiveGameLog,
  display_name: "Away Lineup",
  field_type: "foreign_key",
  foreign_key_entity: "fixturelineup",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

const LIVEGAMELOG_CURRENT_PERIOD_FIELD: FieldMetadata = {
  field_name: "current_period" satisfies keyof LiveGameLog,
  display_name: "Current Period",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  enum_options: LIVE_GAME_PERIOD_OPTIONS,
};

const LIVEGAMELOG_CURRENT_MINUTE_FIELD: FieldMetadata = {
  field_name: "current_minute" satisfies keyof LiveGameLog,
  display_name: "Current Minute",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

const LIVEGAMELOG_STOPPAGE_TIME_MINUTES_FIELD: FieldMetadata = {
  field_name: "stoppage_time_minutes" satisfies keyof LiveGameLog,
  display_name: "Stoppage Time",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

const LIVEGAMELOG_CLOCK_RUNNING_FIELD: FieldMetadata = {
  field_name: "clock_running" satisfies keyof LiveGameLog,
  display_name: "Clock Running",
  field_type: "boolean",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

const LIVEGAMELOG_HOME_TEAM_SCORE_FIELD: FieldMetadata = {
  field_name: "home_team_score" satisfies keyof LiveGameLog,
  display_name: "Home Score",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

const LIVEGAMELOG_AWAY_TEAM_SCORE_FIELD: FieldMetadata = {
  field_name: "away_team_score" satisfies keyof LiveGameLog,
  display_name: "Away Score",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  show_in_list: true,
};

const LIVEGAMELOG_GAME_STATUS_FIELD: FieldMetadata = {
  field_name: "game_status" satisfies keyof LiveGameLog,
  display_name: "Game Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  enum_options: LIVE_GAME_STATUS_OPTIONS,
};

const LIVEGAMELOG_STARTED_AT_FIELD: FieldMetadata = {
  field_name: "started_at" satisfies keyof LiveGameLog,
  display_name: "Started At",
  field_type: "string",
  is_required: false,
  is_read_only: true,
  show_in_list: false,
};

const LIVEGAMELOG_ENDED_AT_FIELD: FieldMetadata = {
  field_name: "ended_at" satisfies keyof LiveGameLog,
  display_name: "Ended At",
  field_type: "string",
  is_required: false,
  is_read_only: true,
  show_in_list: false,
};

const LIVEGAMELOG_NOTES_FIELD: FieldMetadata = {
  field_name: "notes" satisfies keyof LiveGameLog,
  display_name: "Notes",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

const LIVEGAMELOG_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof LiveGameLog,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive", "archived"],
  show_in_list: true,
};

export function register_live_game_log_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("livegamelog", {
    entity_name: "livegamelog",
    display_name: "Live Game Log",
    fields: [
      LIVEGAMELOG_ORGANIZATION_ID_FIELD,
      LIVEGAMELOG_FIXTURE_ID_FIELD,
      LIVEGAMELOG_HOME_LINEUP_ID_FIELD,
      LIVEGAMELOG_AWAY_LINEUP_ID_FIELD,
      LIVEGAMELOG_CURRENT_PERIOD_FIELD,
      LIVEGAMELOG_CURRENT_MINUTE_FIELD,
      LIVEGAMELOG_STOPPAGE_TIME_MINUTES_FIELD,
      LIVEGAMELOG_CLOCK_RUNNING_FIELD,
      LIVEGAMELOG_HOME_TEAM_SCORE_FIELD,
      LIVEGAMELOG_AWAY_TEAM_SCORE_FIELD,
      LIVEGAMELOG_GAME_STATUS_FIELD,
      LIVEGAMELOG_STARTED_AT_FIELD,
      LIVEGAMELOG_ENDED_AT_FIELD,
      LIVEGAMELOG_NOTES_FIELD,
      LIVEGAMELOG_STATUS_FIELD,
    ],
  });
  return metadata_map;
}
