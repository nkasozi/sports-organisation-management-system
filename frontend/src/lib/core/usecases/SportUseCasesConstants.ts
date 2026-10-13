export const SPORT_USE_CASES_LOG_SCOPE = "[SportUseCases]";

export const SportUseCaseEvent = {
  CREATE_NAME_MISSING: "sport_create_name_missing",
  CREATE_FAILED: "sport_create_failed",
  CREATE_INVALID: "sport_create_invalid",
  UPDATE_INVALID: "sport_update_invalid",
  UPDATE_ID_MISSING: "sport_update_id_missing",
  UPDATE_FAILED: "sport_update_failed",
  DELETE_ID_MISSING: "sport_delete_id_missing",
  DELETE_FAILED: "sport_delete_failed",
  DELETE_MANY_IDS_MISSING: "sport_delete_many_ids_missing",
  DELETE_MANY_FAILED: "sport_delete_many_failed",
  GET_ID_MISSING: "sport_get_id_missing",
  GET_FAILED: "sport_get_failed",
  LIST_FAILED: "sport_list_failed",
} as const;

export const SportUseCaseMessage = {
  ID_REQUIRED: "Sport ID is required",
  NAME_REQUIRED: "Sport name is required",
  AT_LEAST_ONE_ID_REQUIRED: "At least one sport ID is required",
  DELETE_MANY_FAILED: "Failed to delete sports",
} as const;
