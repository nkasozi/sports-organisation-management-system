export const QUALIFICATION_USE_CASES_LOG_SCOPE = "[QualificationUseCases]";

export const QualificationUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "qualification_create_validation_failed",
  CREATE_FAILED: "qualification_create_failed",
  UPDATE_TARGET_NOT_FOUND: "qualification_update_target_not_found",
  UPDATE_VALIDATION_FAILED: "qualification_update_validation_failed",
  UPDATE_FAILED: "qualification_update_failed",
  DELETE_FAILED: "qualification_delete_failed",
  GET_FAILED: "qualification_get_failed",
  LIST_FAILED: "qualification_list_failed",
  LIST_BY_HOLDER_FAILED: "qualification_list_by_holder_failed",
} as const;

export const QualificationUseCaseMessage = {
  NOT_FOUND: "Qualification not found",
} as const;

export const QUALIFICATION_DEFAULT_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 100,
} as const;
