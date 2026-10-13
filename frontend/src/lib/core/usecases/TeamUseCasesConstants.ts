export const TEAM_USE_CASES_LOG_SCOPE = "[TeamUseCases]";

export const TeamUseCaseEvent = {
  LIST_FAILED: "team_list_failed",
  GET_ID_MISSING: "team_get_id_missing",
  GET_FAILED: "team_get_failed",
  CREATE_VALIDATION_FAILED: "team_create_validation_failed",
  CREATE_FAILED: "team_create_failed",
  UPDATE_ID_MISSING: "team_update_id_missing",
  UPDATE_FAILED: "team_update_failed",
  DELETE_ID_MISSING: "team_delete_id_missing",
  DELETE_FAILED: "team_delete_failed",
  BULK_DELETE_IDS_MISSING: "team_bulk_delete_ids_missing",
  BULK_DELETE_FAILED: "team_bulk_delete_failed",
  LIST_BY_ORGANIZATION_ID_MISSING: "team_list_by_organization_id_missing",
  LIST_BY_ORGANIZATION_FAILED: "team_list_by_organization_failed",
} as const;

export const TeamUseCaseMessage = {
  ID_REQUIRED: "Team ID is required",
  IDS_REQUIRED: "At least one team ID is required",
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
} as const;
