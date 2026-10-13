import { expect } from "vitest";

import {
  parse_entity_id,
  parse_iso_date_time_string,
  parse_name,
} from "$lib/core/types/DomainScalars";
import {
  type ConflictRecord,
  type ConflictResolutionAction,
  create_known_conflict_field_value,
} from "$lib/infrastructure/sync/conflictTypes";

export function create_entity_id(
  raw_value: string,
): ConflictRecord["local_id"] {
  const entity_id_result = parse_entity_id(raw_value, "Invalid test entity ID");

  if (!entity_id_result.success) {
    return expect.unreachable(entity_id_result.error);
  }

  return entity_id_result.data;
}

function create_timestamp(raw_value: string): ConflictRecord["detected_at"] {
  const timestamp_result = parse_iso_date_time_string(
    raw_value,
    "Invalid test timestamp",
  );

  if (!timestamp_result.success) {
    return expect.unreachable(timestamp_result.error);
  }

  return timestamp_result.data;
}

function create_display_name(raw_value: string): string {
  const display_name_result = parse_name(raw_value, "Invalid test name");

  if (!display_name_result.success) {
    return expect.unreachable(display_name_result.error);
  }

  return display_name_result.data;
}

export function create_mock_conflict(
  overrides: Partial<ConflictRecord> = {},
): ConflictRecord {
  return {
    id: "conflict_teams_team_1_123456",
    table_name: "teams",
    local_id: create_entity_id("team_1"),
    entity_display_name: "Test Team",
    local_data: { name: "Local Team Name", city: "Kampala" },
    remote_data: { name: "Remote Team Name", city: "Kampala" },
    remote_version: 2,
    local_updated_at: create_timestamp("2024-01-01T10:00:00.000Z"),
    remote_updated_at: create_timestamp("2024-01-01T12:00:00.000Z"),
    remote_updated_by: create_known_conflict_field_value(
      create_entity_id("user_123"),
    ),
    remote_updated_by_name: create_known_conflict_field_value(
      create_display_name("John Doe"),
    ),
    field_differences: [
      {
        field_name: "name",
        local_value: "Local Team Name",
        remote_value: "Remote Team Name",
        display_name: "Name",
      },
    ],
    detected_at: create_timestamp("2024-01-01T14:00:00.000Z"),
    ...overrides,
  } as ConflictRecord;
}

export function get_resolved_data_for_action(
  conflict: ConflictRecord,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): Record<string, unknown> {
  switch (action) {
    case "keep_local":
      return {
        ...conflict.local_data,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>;
    case "keep_remote":
      return conflict.remote_data;
    case "merge":
      return merged_data || conflict.local_data;
    default:
      return conflict.local_data;
  }
}
