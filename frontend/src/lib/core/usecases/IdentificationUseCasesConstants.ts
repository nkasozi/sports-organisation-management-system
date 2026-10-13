export const IDENTIFICATION_USE_CASES_LOG_SCOPE = "[IdentificationUseCases]";

export const IDENTIFICATION_ENTITY_TYPE = "identification";

export const IdentificationUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "identification_create_validation_failed",
  CREATE_FAILED: "identification_create_failed",
  UPDATE_ID_MISSING: "identification_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "identification_update_target_not_found",
  UPDATE_VALIDATION_FAILED: "identification_update_validation_failed",
  UPDATE_FAILED: "identification_update_failed",
  DELETE_ID_MISSING: "identification_delete_id_missing",
  DELETE_FAILED: "identification_delete_failed",
  DELETE_TARGET_NOT_FOUND: "identification_delete_target_not_found",
  GET_ID_MISSING: "identification_get_id_missing",
  GET_FAILED: "identification_get_failed",
  LIST_FAILED: "identification_list_failed",
  LIST_BY_HOLDER_FAILED: "identification_list_by_holder_failed",
  LIST_BY_ENTITY_ID_MISSING: "identification_list_by_entity_id_missing",
  WRITE_OUTSIDE_OWN_SCOPE: "identification_write_outside_own_scope",
  VERIFICATION_CHANGE_BLOCKED: "identification_verification_change_blocked",
} as const;

export const IdentificationUseCaseMessage = {
  ID_REQUIRED: "Identification ID is required",
  NOT_FOUND: "Identification not found",
  ENTITY_ID_REQUIRED: "Entity ID is required",
  OWN_RECORDS_ONLY:
    "You can only add, change or remove your own identity documents.",
  VERIFICATION_ADMIN_ONLY:
    "Only administrators can change the verification status of identity documents.",
} as const;

export const IDENTIFICATION_DEFAULT_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 100,
} as const;

export const IDENTIFICATION_LIST_ALL_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 1000,
} as const;
