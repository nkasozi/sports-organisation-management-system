export const TEAM_STAFF_USE_CASES_LOG_SCOPE = "[TeamStaffUseCases]";

export const TeamStaffUseCaseEvent = {
  LIST_FAILED: "team_staff_list_failed",
  GET_ID_MISSING: "team_staff_get_id_missing",
  GET_FAILED: "team_staff_get_failed",
  CREATE_VALIDATION_FAILED: "team_staff_create_validation_failed",
  CREATE_FAILED: "team_staff_create_failed",
  UPDATE_ID_MISSING: "team_staff_update_id_missing",
  UPDATE_FAILED: "team_staff_update_failed",
  DELETE_ID_MISSING: "team_staff_delete_id_missing",
  DELETE_FAILED: "team_staff_delete_failed",
  LIST_BY_TEAM_ID_MISSING: "team_staff_list_by_team_id_missing",
  LIST_BY_TEAM_FAILED: "team_staff_list_by_team_failed",
  LIST_ROLES_FAILED: "team_staff_list_roles_failed",
} as const;

export const TeamStaffUseCaseMessage = {
  ID_REQUIRED: "Team staff ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
} as const;

export const TEAM_STAFF_ROLES_QUERY_OPTIONS = { page_size: 100 } as const;

export const TEAM_STAFF_SINGLE_PAGE_NUMBER = 1;
