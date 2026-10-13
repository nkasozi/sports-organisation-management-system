export const IDENTIFICATION_TYPE_USE_CASES_LOG_SCOPE =
  "[IdentificationTypeUseCases]";

export const IdentificationTypeUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "identification_type_create_validation_failed",
  CREATE_FAILED: "identification_type_create_failed",
  UPDATE_ID_MISSING: "identification_type_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "identification_type_update_target_not_found",
  UPDATE_VALIDATION_FAILED: "identification_type_update_validation_failed",
  UPDATE_FAILED: "identification_type_update_failed",
  DELETE_ID_MISSING: "identification_type_delete_id_missing",
  DELETE_FAILED: "identification_type_delete_failed",
  GET_ID_MISSING: "identification_type_get_id_missing",
  GET_FAILED: "identification_type_get_failed",
  LIST_FAILED: "identification_type_list_failed",
  LIST_BY_SPORT_ID_MISSING: "identification_type_list_by_sport_id_missing",
  LIST_BY_SPORT_FAILED: "identification_type_list_by_sport_failed",
} as const;

export const IdentificationTypeUseCaseMessage = {
  ID_REQUIRED: "Identification type ID is required",
  NOT_FOUND: "Identification type not found",
  SPORT_ID_REQUIRED: "Sport ID is required",
} as const;

export const IDENTIFICATION_TYPE_DEFAULT_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 100,
} as const;

export const IDENTIFICATION_TYPE_LIST_ALL_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 1000,
} as const;
