export const PLAYER_POSITION_USE_CASES_LOG_SCOPE = "[PlayerPositionUseCases]";

export const PlayerPositionUseCaseEvent = {
  LIST_FAILED: "player_position_list_failed",
  GET_ID_MISSING: "player_position_get_id_missing",
  GET_FAILED: "player_position_get_failed",
  CREATE_VALIDATION_FAILED: "player_position_create_validation_failed",
  CREATE_CODE_LOOKUP_FAILED: "player_position_create_code_lookup_failed",
  CREATE_CODE_CONFLICT: "player_position_create_code_conflict",
  CREATE_FAILED: "player_position_create_failed",
  UPDATE_ID_MISSING: "player_position_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "player_position_update_target_not_found",
  UPDATE_CODE_LOOKUP_FAILED: "player_position_update_code_lookup_failed",
  UPDATE_CODE_CONFLICT: "player_position_update_code_conflict",
  UPDATE_FAILED: "player_position_update_failed",
  DELETE_ID_MISSING: "player_position_delete_id_missing",
  DELETE_FAILED: "player_position_delete_failed",
  FIND_BY_CODE_FAILED: "player_position_find_by_code_failed",
  FIND_BY_SPORT_TYPE_FAILED: "player_position_find_by_sport_type_failed",
  FIND_BY_CATEGORY_FAILED: "player_position_find_by_category_failed",
  FIND_AVAILABLE_FAILED: "player_position_find_available_failed",
  LIST_BY_SPORT_TYPE_MISSING: "player_position_list_by_sport_type_missing",
} as const;

export const PlayerPositionUseCaseMessage = {
  ID_REQUIRED: "Position ID is required",
  NOT_FOUND: "Position not found",
  SPORT_TYPE_REQUIRED: "Sport type is required",
} as const;

export function build_position_code_conflict_message(code: string): string {
  return `Position with code '${code}' already exists`;
}

export const PositionCodeLookupStatus = {
  UNUSED: "unused",
  IN_USE: "in_use",
} as const;
