export const OFFICIAL_USE_CASES_LOG_SCOPE = "[OfficialUseCases]";

export const OfficialUseCaseEvent = {
  LIST_FAILED: "official_list_failed",
  GET_ID_MISSING: "official_get_id_missing",
  GET_FAILED: "official_get_failed",
  CREATE_VALIDATION_FAILED: "official_create_validation_failed",
  CREATE_FAILED: "official_create_failed",
  UPDATE_ID_MISSING: "official_update_id_missing",
  UPDATE_FAILED: "official_update_failed",
  DELETE_ID_MISSING: "official_delete_id_missing",
  DELETE_FAILED: "official_delete_failed",
  BULK_DELETE_IDS_MISSING: "official_bulk_delete_ids_missing",
  BULK_DELETE_FAILED: "official_bulk_delete_failed",
  LIST_BY_ORGANIZATION_ID_MISSING: "official_list_by_organization_id_missing",
  LIST_BY_ORGANIZATION_FAILED: "official_list_by_organization_failed",
  LIST_BY_ROLE_ID_MISSING: "official_list_by_role_id_missing",
  LIST_BY_ROLE_FAILED: "official_list_by_role_failed",
  LIST_AVAILABLE_DATE_MISSING: "official_list_available_date_missing",
  LIST_AVAILABLE_FAILED: "official_list_available_failed",
} as const;

export const OfficialUseCaseMessage = {
  ID_REQUIRED: "Official ID is required",
  IDS_REQUIRED: "Official IDs are required",
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
  ROLE_ID_REQUIRED: "Role ID is required",
  DATE_REQUIRED: "Date is required",
} as const;
