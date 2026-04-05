import type { EntityMetadata } from "../../core/entities/BaseEntity";

export function register_game_assignment_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("game_assignment", {
    entity_name: "game_assignment",
    display_name: "Game Assignment",
    fields: [
      {
        field_name: "game_id",
        display_name: "Game",
        field_type: "foreign_key",
        foreign_key_entity: "game",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "official_id",
        display_name: "Official",
        field_type: "foreign_key",
        foreign_key_entity: "official",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "assignment_role",
        display_name: "Role",
        field_type: "enum",
        enum_values: [
          "referee",
          "assistant_referee",
          "fourth_official",
          "timekeeper",
          "scorekeeper",
        ],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "confirmed",
        display_name: "Confirmed",
        field_type: "boolean",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "assigned_at",
        display_name: "Assigned At",
        field_type: "date",
        is_required: true,
        is_read_only: true,
        show_in_list: true,
      },
      {
        field_name: "assigned_by_user_id",
        display_name: "Assigned By User",
        field_type: "string",
        is_required: true,
        is_read_only: true,
      },
      {
        field_name: "notes",
        display_name: "Notes",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
    ],
  });
  return metadata_map;
}

export function register_active_game_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("active_game", {
    entity_name: "active_game",
    display_name: "Active Game",
    fields: [
      {
        field_name: "game_id",
        display_name: "Game",
        field_type: "foreign_key",
        foreign_key_entity: "game",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "current_status",
        display_name: "Current Status",
        field_type: "enum",
        enum_values: [
          "pre_game",
          "first_half",
          "half_time",
          "second_half",
          "extra_time",
          "penalty_shootout",
          "finished",
        ],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "current_minute",
        display_name: "Current Minute",
        field_type: "number",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "stoppage_time_minutes",
        display_name: "Stoppage Time (Minutes)",
        field_type: "number",
        is_required: true,
        is_read_only: false,
      },
      {
        field_name: "home_team_score",
        display_name: "Home Team Score",
        field_type: "number",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "away_team_score",
        display_name: "Away Team Score",
        field_type: "number",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "last_event_timestamp",
        display_name: "Last Event Time",
        field_type: "date",
        is_required: true,
        is_read_only: true,
      },
      {
        field_name: "game_started_by_user_id",
        display_name: "Started By User",
        field_type: "string",
        is_required: true,
        is_read_only: true,
      },
    ],
  });
  return metadata_map;
}
