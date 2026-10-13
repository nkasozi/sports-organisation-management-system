import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { OfficialAssociatedTeam } from "../../core/entities/OfficialAssociatedTeam";
import { OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS } from "../../core/entities/OfficialAssociatedTeam";
import type { OfficialPerformanceRating } from "../../core/entities/OfficialPerformanceRating";

export const OFFICIALASSOCIATEDTEAM_OFFICIAL_ID_FIELD: FieldMetadata = {
  field_name: "official_id" satisfies keyof OfficialAssociatedTeam,
  display_name: "Official",
  field_type: "foreign_key",
  foreign_key_entity: "official",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const OFFICIALASSOCIATEDTEAM_TEAM_ID_FIELD: FieldMetadata = {
  field_name: "team_id" satisfies keyof OfficialAssociatedTeam,
  display_name: "Team",
  field_type: "foreign_key",
  foreign_key_entity: "team",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const OFFICIALASSOCIATEDTEAM_ASSOCIATION_TYPE_FIELD: FieldMetadata = {
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
};

export const OFFICIALASSOCIATEDTEAM_START_DATE_FIELD: FieldMetadata = {
  field_name: "start_date" satisfies keyof OfficialAssociatedTeam,
  display_name: "Start Date",
  field_type: "date",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const OFFICIALASSOCIATEDTEAM_END_DATE_FIELD: FieldMetadata = {
  field_name: "end_date" satisfies keyof OfficialAssociatedTeam,
  display_name: "End Date",
  field_type: "date",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const OFFICIALASSOCIATEDTEAM_NOTES_FIELD: FieldMetadata = {
  field_name: "notes" satisfies keyof OfficialAssociatedTeam,
  display_name: "Notes",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

export const OFFICIALASSOCIATEDTEAM_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof OfficialAssociatedTeam,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive"],
  show_in_list: true,
};

export const OFFICIALPERFORMANCERATING_ORGANIZATION_ID_FIELD: FieldMetadata = {
  field_name: "organization_id" satisfies keyof OfficialPerformanceRating,
  display_name: "Organization",
  field_type: "foreign_key",
  foreign_key_entity: "organization",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const OFFICIALPERFORMANCERATING_FIXTURE_ID_FIELD: FieldMetadata = {
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
};

export const OFFICIALPERFORMANCERATING_OFFICIAL_ID_FIELD: FieldMetadata = {
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
};

export const OFFICIALPERFORMANCERATING_RATER_USER_ID_FIELD: FieldMetadata = {
  field_name: "rater_user_id" satisfies keyof OfficialPerformanceRating,
  display_name: "Rated By",
  field_type: "foreign_key",
  foreign_key_entity: "systemuser",
  is_required: false,
  is_read_only: true,
  show_in_list: true,
  hide_on_create: true,
  hide_on_edit: true,
};

export const OFFICIALPERFORMANCERATING_RATER_ROLE_FIELD: FieldMetadata = {
  field_name: "rater_role" satisfies keyof OfficialPerformanceRating,
  display_name: "Rater Role",
  field_type: "string",
  is_required: true,
  is_read_only: true,
  show_in_list: true,
  hide_on_create: true,
  hide_on_edit: true,
};

export const OFFICIALPERFORMANCERATING_OVERALL_FIELD: FieldMetadata = {
  field_name: "overall" satisfies keyof OfficialPerformanceRating,
  display_name: "Overall (1–10)",
  field_type: "star_rating",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
};

export const OFFICIALPERFORMANCERATING_DECISION_ACCURACY_FIELD: FieldMetadata =
  {
    field_name: "decision_accuracy" satisfies keyof OfficialPerformanceRating,
    display_name: "Decision Accuracy (1–10)",
    field_type: "star_rating",
    is_required: true,
    is_read_only: false,
    show_in_list: false,
  };

export const OFFICIALPERFORMANCERATING_GAME_CONTROL_FIELD: FieldMetadata = {
  field_name: "game_control" satisfies keyof OfficialPerformanceRating,
  display_name: "Game Control (1–10)",
  field_type: "star_rating",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const OFFICIALPERFORMANCERATING_COMMUNICATION_FIELD: FieldMetadata = {
  field_name: "communication" satisfies keyof OfficialPerformanceRating,
  display_name: "Communication (1–10)",
  field_type: "star_rating",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const OFFICIALPERFORMANCERATING_FITNESS_FIELD: FieldMetadata = {
  field_name: "fitness" satisfies keyof OfficialPerformanceRating,
  display_name: "Fitness & Mobility (1–10)",
  field_type: "star_rating",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

export const OFFICIALPERFORMANCERATING_NOTES_FIELD: FieldMetadata = {
  field_name: "notes" satisfies keyof OfficialPerformanceRating,
  display_name: "Notes",
  field_type: "string",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};
