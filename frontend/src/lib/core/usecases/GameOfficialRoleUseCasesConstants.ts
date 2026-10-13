export const GAME_OFFICIAL_ROLE_USE_CASES_LOG_SCOPE =
  "[GameOfficialRoleUseCases]";

export const GAME_OFFICIAL_ROLE_MIN_NAME_LENGTH = 2;

export const GAME_OFFICIAL_ROLE_MIN_CODE_LENGTH = 2;

export const GameOfficialRoleUseCaseEvent = {
  LIST_FAILED: "game_official_role_list_failed",
  GET_ID_MISSING: "game_official_role_get_id_missing",
  GET_FAILED: "game_official_role_get_failed",
  CREATE_NAME_INVALID: "game_official_role_create_name_invalid",
  CREATE_CODE_INVALID: "game_official_role_create_code_invalid",
  CREATE_FAILED: "game_official_role_create_failed",
  UPDATE_ID_MISSING: "game_official_role_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "game_official_role_update_target_not_found",
  UPDATE_FAILED: "game_official_role_update_failed",
  DELETE_ID_MISSING: "game_official_role_delete_id_missing",
  DELETE_FAILED: "game_official_role_delete_failed",
  LIST_FOR_SPORT_FAILED: "game_official_role_list_for_sport_failed",
} as const;

export const GameOfficialRoleUseCaseMessage = {
  ID_REQUIRED: "Official role ID is required",
  NOT_FOUND: "Official role not found",
  NAME_TOO_SHORT: "Role name must be at least 2 characters",
  CODE_TOO_SHORT: "Role code must be at least 2 characters",
} as const;
