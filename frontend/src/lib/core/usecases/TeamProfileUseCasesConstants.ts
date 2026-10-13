export const TEAM_PROFILE_USE_CASES_LOG_SCOPE = "[TeamProfileUseCases]";

export const TeamProfileUseCaseEvent = {
  LIST_FAILED: "team_profile_list_failed",
  LIST_PUBLIC_FAILED: "team_profile_list_public_failed",
  GET_ID_MISSING: "team_profile_get_id_missing",
  GET_FAILED: "team_profile_get_failed",
  GET_BY_TEAM_ID_MISSING: "team_profile_get_by_team_id_missing",
  GET_BY_TEAM_FAILED: "team_profile_get_by_team_failed",
  GET_BY_SLUG_MISSING: "team_profile_get_by_slug_missing",
  GET_BY_SLUG_FAILED: "team_profile_get_by_slug_failed",
  CREATE_VALIDATION_FAILED: "team_profile_create_validation_failed",
  CREATE_FAILED: "team_profile_create_failed",
  UPDATE_ID_MISSING: "team_profile_update_id_missing",
  UPDATE_VALIDATION_FAILED: "team_profile_update_validation_failed",
  UPDATE_FAILED: "team_profile_update_failed",
  DELETE_ID_MISSING: "team_profile_delete_id_missing",
  DELETE_FAILED: "team_profile_delete_failed",
} as const;

export const TeamProfileUseCaseMessage = {
  ID_REQUIRED: "Profile ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
  SLUG_REQUIRED: "Profile slug is required",
} as const;
