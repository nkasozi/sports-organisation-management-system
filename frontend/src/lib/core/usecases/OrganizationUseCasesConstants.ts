export const ORGANIZATION_USE_CASES_LOG_SCOPE = "[OrganizationUseCases]";

export const OrganizationUseCaseEvent = {
  LIST_FAILED: "organization_list_failed",
  GET_ID_MISSING: "organization_get_id_missing",
  GET_FAILED: "organization_get_failed",
  CREATE_VALIDATION_FAILED: "organization_create_validation_failed",
  CREATE_FAILED: "organization_create_failed",
  UPDATE_ID_MISSING: "organization_update_id_missing",
  UPDATE_FAILED: "organization_update_failed",
  DELETE_ID_MISSING: "organization_delete_id_missing",
  DELETE_FAILED: "organization_delete_failed",
  BULK_DELETE_IDS_MISSING: "organization_bulk_delete_ids_missing",
  BULK_DELETE_FAILED: "organization_bulk_delete_failed",
  SEED_DEFAULTS_FAILED: "organization_seed_defaults_failed",
} as const;

export const OrganizationUseCaseMessage = {
  ID_REQUIRED: "Organization ID is required",
  IDS_REQUIRED: "At least one organization ID is required",
} as const;
