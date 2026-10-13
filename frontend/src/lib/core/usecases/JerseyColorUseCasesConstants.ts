export const JERSEY_COLOR_USE_CASES_LOG_SCOPE = "[JerseyColorUseCases]";

export const JerseyColorUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "jersey_color_create_validation_failed",
  CREATE_FAILED: "jersey_color_create_failed",
  UPDATE_ID_MISSING: "jersey_color_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "jersey_color_update_target_not_found",
  UPDATE_VALIDATION_FAILED: "jersey_color_update_validation_failed",
  UPDATE_FAILED: "jersey_color_update_failed",
  DELETE_ID_MISSING: "jersey_color_delete_id_missing",
  DELETE_FAILED: "jersey_color_delete_failed",
  GET_ID_MISSING: "jersey_color_get_id_missing",
  GET_FAILED: "jersey_color_get_failed",
  LIST_FAILED: "jersey_color_list_failed",
  LIST_BY_HOLDER_FAILED: "jersey_color_list_by_holder_failed",
  LIST_BY_ENTITY_ID_MISSING: "jersey_color_list_by_entity_id_missing",
} as const;

export const JerseyColorUseCaseMessage = {
  ID_REQUIRED: "Jersey Color ID is required",
  NOT_FOUND: "Jersey Color not found",
  HOLDER_ID_REQUIRED: "Holder ID is required",
} as const;

export const JERSEY_COLOR_LIST_ALL_QUERY_OPTIONS = {
  page_size: 1000,
} as const;
