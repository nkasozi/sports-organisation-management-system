export const GENDER_USE_CASES_LOG_SCOPE = "[GenderUseCases]";

export const GenderUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "gender_create_validation_failed",
  CREATE_FAILED: "gender_create_failed",
  UPDATE_ID_MISSING: "gender_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "gender_update_target_not_found",
  UPDATE_VALIDATION_FAILED: "gender_update_validation_failed",
  UPDATE_FAILED: "gender_update_failed",
  DELETE_ID_MISSING: "gender_delete_id_missing",
  DELETE_FAILED: "gender_delete_failed",
  GET_ID_MISSING: "gender_get_id_missing",
  GET_FAILED: "gender_get_failed",
  LIST_FAILED: "gender_list_failed",
} as const;

export const GenderUseCaseMessage = {
  ID_REQUIRED: "Gender ID is required",
  NOT_FOUND: "Gender not found",
} as const;

export const GENDER_DEFAULT_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 100,
} as const;

export const GENDER_LIST_ALL_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 1000,
} as const;
