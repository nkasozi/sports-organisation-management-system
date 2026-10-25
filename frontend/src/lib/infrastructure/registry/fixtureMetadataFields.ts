import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { Fixture } from "../../core/entities/Fixture";
import { FIXTURE_STATUS } from "../../core/entities/StatusConstants";

export const FIXTURE_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof Fixture,
  display_name: "Organization",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  is_read_only_on_edit: true,
  foreign_key_entity: "organization",
};

export const FIXTURE_COMPETITION_ID_FIELD: FieldMetadata = {
  field_name: "competition_id" satisfies keyof Fixture,
  display_name: "Competition",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  is_read_only_on_edit: true,
  foreign_key_entity: "competition",
  foreign_key_filter: {
    depends_on_field: "organization_id",
    filter_type: "competitions_from_organization",
  },
};

export const FIXTURE_STAGE_ID_FIELD: FieldMetadata = {
  field_name: "stage_id" satisfies keyof Fixture,
  display_name: "Stage",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  foreign_key_entity: "competitionstage",
  show_in_list: false,
  foreign_key_filter: {
    depends_on_field: "competition_id",
    filter_type: "stages_from_competition",
  },
};

export const FIXTURE_HOME_TEAM_ID_FIELD: FieldMetadata = {
  field_name: "home_team_id" satisfies keyof Fixture,
  display_name: "Home Team",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  is_read_only_on_edit: true,
  foreign_key_entity: "team",
  show_in_list: true,
  foreign_key_filter: {
    depends_on_field: "competition_id",
    filter_type: "teams_from_competition",
    exclude_field: "away_team_id",
  },
};

export const FIXTURE_AWAY_TEAM_ID_FIELD: FieldMetadata = {
  field_name: "away_team_id" satisfies keyof Fixture,
  display_name: "Away Team",
  field_type: "foreign_key",
  is_required: true,
  is_read_only: false,
  is_read_only_on_edit: true,
  foreign_key_entity: "team",
  show_in_list: true,
  foreign_key_filter: {
    depends_on_field: "competition_id",
    filter_type: "teams_from_competition",
    exclude_field: "home_team_id",
  },
};

export const FIXTURE_SCHEDULED_DATE_FIELD: FieldMetadata = {
  field_name: "scheduled_date" satisfies keyof Fixture,
  display_name: "Scheduled Date",
  field_type: "date",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const FIXTURE_VENUE_FIELD: FieldMetadata = {
  field_name: "venue" satisfies keyof Fixture,
  display_name: "Venue",
  field_type: "foreign_key",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
  foreign_key_entity: "venue",
  foreign_key_value_field: "name",
  foreign_key_filter: {
    depends_on_field: "organization_id",
    filter_type: "lookup_from_organization",
  },
};

export const FIXTURE_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof Fixture,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: true,
  enum_values: Object.values(FIXTURE_STATUS),
  show_in_list: true,
};

export const FIXTURE_HOME_TEAM_SCORE_FIELD: FieldMetadata = {
  field_name: "home_team_score" satisfies keyof Fixture,
  display_name: "Home Team Score",
  field_type: "number",
  is_required: false,
  is_read_only: true,
  hide_on_create: true,
  validation_rules: [
    {
      rule_type: "min_value",
      rule_value: 0,
      error_message: "Score cannot be negative",
    },
  ],
};

export const FIXTURE_AWAY_TEAM_SCORE_FIELD: FieldMetadata = {
  field_name: "away_team_score" satisfies keyof Fixture,
  display_name: "Away Team Score",
  field_type: "number",
  is_required: false,
  is_read_only: true,
  hide_on_create: true,
  validation_rules: [
    {
      rule_type: "min_value",
      rule_value: 0,
      error_message: "Score cannot be negative",
    },
  ],
};

export const FIXTURE_ACTUAL_START_TIME_FIELD: FieldMetadata = {
  field_name: "actual_start_time",
  display_name: "Actual Start Time",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  hide_on_create: true,
};

export const FIXTURE_ACTUAL_END_TIME_FIELD: FieldMetadata = {
  field_name: "actual_end_time",
  display_name: "Actual End Time",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  hide_on_create: true,
};

export const FIXTURE_MANUAL_IMPORTANCE_OVERRIDE_FIELD: FieldMetadata = {
  field_name: "manual_importance_override" satisfies keyof Fixture,
  display_name: "Importance Weight Override (1–3)",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  hide_on_create: true,
  show_in_list: false,
};
