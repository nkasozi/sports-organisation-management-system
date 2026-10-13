export const GAME_EVENT_TYPE_USE_CASES_LOG_SCOPE = "[GameEventTypeUseCases]";

export const GAME_EVENT_TYPE_MIN_NAME_LENGTH = 2;

export const GAME_EVENT_TYPE_MIN_CODE_LENGTH = 2;

export const GameEventTypeUseCaseEvent = {
  LIST_FAILED: "game_event_type_list_failed",
  GET_ID_MISSING: "game_event_type_get_id_missing",
  GET_FAILED: "game_event_type_get_failed",
  GET_BY_CODE_FAILED: "game_event_type_get_by_code_failed",
  LIST_FOR_SPORT_FAILED: "game_event_type_list_for_sport_failed",
  LIST_BY_CATEGORY_FAILED: "game_event_type_list_by_category_failed",
  LIST_SCORING_FAILED: "game_event_type_list_scoring_failed",
  CREATE_NAME_INVALID: "game_event_type_create_name_invalid",
  CREATE_CODE_INVALID: "game_event_type_create_code_invalid",
  CREATE_CODE_LOOKUP_FAILED: "game_event_type_create_code_lookup_failed",
  CREATE_CODE_CONFLICT: "game_event_type_create_code_conflict",
  CREATE_FAILED: "game_event_type_create_failed",
  UPDATE_ID_MISSING: "game_event_type_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "game_event_type_update_target_not_found",
  UPDATE_CODE_LOOKUP_FAILED: "game_event_type_update_code_lookup_failed",
  UPDATE_CODE_CONFLICT: "game_event_type_update_code_conflict",
  UPDATE_FAILED: "game_event_type_update_failed",
  DELETE_ID_MISSING: "game_event_type_delete_id_missing",
  DELETE_FAILED: "game_event_type_delete_failed",
} as const;

export const GameEventTypeUseCaseMessage = {
  ID_REQUIRED: "Event type ID is required",
  NOT_FOUND: "Event type not found",
  NAME_TOO_SHORT: "Event type name must be at least 2 characters",
  CODE_TOO_SHORT: "Event type code must be at least 2 characters",
} as const;

export function build_duplicate_event_type_code_message(code: string): string {
  return `Event type with code '${code}' already exists`;
}
