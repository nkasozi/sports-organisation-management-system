import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Fixture } from "../../core/entities/Fixture";
import {
  FIXTURE_ACTUAL_END_TIME_FIELD,
  FIXTURE_ACTUAL_START_TIME_FIELD,
  FIXTURE_AWAY_TEAM_ID_FIELD,
  FIXTURE_AWAY_TEAM_SCORE_FIELD,
  FIXTURE_COMPETITION_ID_FIELD,
  FIXTURE_HOME_TEAM_ID_FIELD,
  FIXTURE_HOME_TEAM_SCORE_FIELD,
  FIXTURE_MANUAL_IMPORTANCE_OVERRIDE_FIELD,
  FIXTURE_ORGANIZATION_ID_FIELD,
  FIXTURE_SCHEDULED_DATE_FIELD,
  FIXTURE_STAGE_ID_FIELD,
  FIXTURE_STATUS_FIELD,
  FIXTURE_VENUE_FIELD,
} from "./fixtureMetadataFields";

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
      FIXTURE_ORGANIZATION_ID_FIELD,
      FIXTURE_COMPETITION_ID_FIELD,
      FIXTURE_STAGE_ID_FIELD,
      FIXTURE_HOME_TEAM_ID_FIELD,
      FIXTURE_AWAY_TEAM_ID_FIELD,
      FIXTURE_SCHEDULED_DATE_FIELD,
      {
        field_name: "scheduled_time" satisfies keyof Fixture,
        display_name: "Scheduled Time",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        enum_values: generate_30_minute_time_intervals(),
      },
      FIXTURE_VENUE_FIELD,
      FIXTURE_STATUS_FIELD,
      FIXTURE_HOME_TEAM_SCORE_FIELD,
      FIXTURE_AWAY_TEAM_SCORE_FIELD,
      FIXTURE_ACTUAL_START_TIME_FIELD,
      FIXTURE_ACTUAL_END_TIME_FIELD,
      FIXTURE_MANUAL_IMPORTANCE_OVERRIDE_FIELD,
    ],
  });
  return metadata_map;
}
