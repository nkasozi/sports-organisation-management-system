export const TEAM_STAFF_ROLE_USE_CASES_LOG_SCOPE = "[TeamStaffRoleUseCases]";

export const TeamStaffRoleUseCaseEvent = {
  LIST_FAILED: "team_staff_role_list_failed",
  GET_ID_MISSING: "team_staff_role_get_id_missing",
  GET_FAILED: "team_staff_role_get_failed",
  CREATE_VALIDATION_FAILED: "team_staff_role_create_validation_failed",
  CREATE_FAILED: "team_staff_role_create_failed",
  UPDATE_ID_MISSING: "team_staff_role_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "team_staff_role_update_target_not_found",
  UPDATE_FAILED: "team_staff_role_update_failed",
  DELETE_ID_MISSING: "team_staff_role_delete_id_missing",
  DELETE_FAILED: "team_staff_role_delete_failed",
  LIST_BY_CATEGORY_FAILED: "team_staff_role_list_by_category_failed",
} as const;

export const TeamStaffRoleUseCaseMessage = {
  ID_REQUIRED: "Staff role ID is required",
  NOT_FOUND: "Staff role not found",
} as const;
