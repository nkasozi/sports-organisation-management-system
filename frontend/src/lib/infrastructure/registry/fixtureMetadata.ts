import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Fixture } from "../../core/entities/Fixture";

function generate_30_minute_time_intervals(): string[] {
  const intervals: string[] = [];
  for (let hour = 7; hour <= 23; hour++) {
    const hour_string = hour.toString().padStart(2, "0");
    intervals.push(`${hour_string}:00`);
    if (hour < 24) {
      intervals.push(`${hour_string}:30`);
    }
  }
  intervals.push("00:00");
  return intervals;
}

export function register_fixture_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("fixture", {
    entity_name: "fixture",
    display_name: "Fixture",
    fields: [
      {
        field_name: "organization_id" satisfies keyof Fixture,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "organization",
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
        field_name: "scheduled_date" satisfies keyof Fixture,
        display_name: "Scheduled Date",
        field_type: "date",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "scheduled_time" satisfies keyof Fixture,
        display_name: "Scheduled Time",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        enum_values: generate_30_minute_time_intervals(),
      },
      {
        field_name: "venue" satisfies keyof Fixture,
        display_name: "Venue",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "status" satisfies keyof Fixture,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: [
          "scheduled",
          "in_progress",
          "paused",
          "completed",
          "cancelled",
          "postponed",
        ],
        show_in_list: true,
      },
      {
        field_name: "home_team_score" satisfies keyof Fixture,
        display_name: "Home Team Score",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        hide_on_create: true,
        validation_rules: [
          {
            rule_type: "min_value",
            rule_value: 0,
            error_message: "Score cannot be negative",
          },
        ],
      },
      {
        field_name: "away_team_score" satisfies keyof Fixture,
        display_name: "Away Team Score",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        hide_on_create: true,
        validation_rules: [
          {
            rule_type: "min_value",
            rule_value: 0,
            error_message: "Score cannot be negative",
          },
        ],
      },
      {
        field_name: "actual_start_time",
        display_name: "Actual Start Time",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        hide_on_create: true,
      },
      {
        field_name: "actual_end_time",
        display_name: "Actual End Time",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        hide_on_create: true,
      },
      {
        field_name: "manual_importance_override" satisfies keyof Fixture,
        display_name: "Importance Weight Override (1–3)",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        hide_on_create: true,
        show_in_list: false,
      },
    ],
  });
  return metadata_map;
}
