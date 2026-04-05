import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { OfficialAssociatedTeam } from "../../core/entities/OfficialAssociatedTeam";
import { OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS } from "../../core/entities/OfficialAssociatedTeam";
import type { OfficialPerformanceRating } from "../../core/entities/OfficialPerformanceRating";

export function register_official_associated_team_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("officialassociatedteam", {
    entity_name: "officialassociatedteam",
    display_name: "Official Associated Team",
    fields: [
      {
        field_name: "official_id" satisfies keyof OfficialAssociatedTeam,
        display_name: "Official",
        field_type: "foreign_key",
        foreign_key_entity: "official",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "team_id" satisfies keyof OfficialAssociatedTeam,
        display_name: "Team",
        field_type: "foreign_key",
        foreign_key_entity: "team",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "association_type" satisfies keyof OfficialAssociatedTeam,
        display_name: "Association Type",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        enum_values: [
          "current_member",
          "former_member",
          "family_connection",
          "financial_interest",
          "other",
        ],
        enum_options: OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS,
      },
      {
        field_name: "start_date" satisfies keyof OfficialAssociatedTeam,
        display_name: "Start Date",
        field_type: "date",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "end_date" satisfies keyof OfficialAssociatedTeam,
        display_name: "End Date",
        field_type: "date",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "notes" satisfies keyof OfficialAssociatedTeam,
        display_name: "Notes",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "status" satisfies keyof OfficialAssociatedTeam,
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

export function register_official_performance_rating_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("officialperformancerating", {
    entity_name: "officialperformancerating",
    display_name: "Official Performance Rating",
    fields: [
      {
        field_name: "organization_id" satisfies keyof OfficialPerformanceRating,
        display_name: "Organization",
        field_type: "foreign_key",
        foreign_key_entity: "organization",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "fixture_id" satisfies keyof OfficialPerformanceRating,
        display_name: "Fixture",
        field_type: "foreign_key",
        foreign_key_entity: "fixture",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "fixtures_for_rating",
        },
      },
      {
        field_name: "official_id" satisfies keyof OfficialPerformanceRating,
        display_name: "Official",
        field_type: "foreign_key",
        foreign_key_entity: "official",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "fixture_id",
          filter_type: "officials_from_fixture",
        },
      },
      {
        field_name: "rater_user_id" satisfies keyof OfficialPerformanceRating,
        display_name: "Rated By",
        field_type: "foreign_key",
        foreign_key_entity: "systemuser",
        is_required: false,
        is_read_only: true,
        show_in_list: true,
        hide_on_create: true,
        hide_on_edit: true,
      },
      {
        field_name: "rater_role" satisfies keyof OfficialPerformanceRating,
        display_name: "Rater Role",
        field_type: "string",
        is_required: true,
        is_read_only: true,
        show_in_list: true,
        hide_on_create: true,
        hide_on_edit: true,
      },
      {
        field_name: "overall" satisfies keyof OfficialPerformanceRating,
        display_name: "Overall (1–10)",
        field_type: "star_rating",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name:
          "decision_accuracy" satisfies keyof OfficialPerformanceRating,
        display_name: "Decision Accuracy (1–10)",
        field_type: "star_rating",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "game_control" satisfies keyof OfficialPerformanceRating,
        display_name: "Game Control (1–10)",
        field_type: "star_rating",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "communication" satisfies keyof OfficialPerformanceRating,
        display_name: "Communication (1–10)",
        field_type: "star_rating",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "fitness" satisfies keyof OfficialPerformanceRating,
        display_name: "Fitness & Mobility (1–10)",
        field_type: "star_rating",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "notes" satisfies keyof OfficialPerformanceRating,
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
