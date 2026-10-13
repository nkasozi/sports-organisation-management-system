export const PLAYER_PROFILE_USE_CASES_LOG_SCOPE = "[PlayerProfileUseCases]";

export const PlayerProfileUseCaseEvent = {
  LIST_FAILED: "player_profile_list_failed",
  LIST_PUBLIC_FAILED: "player_profile_list_public_failed",
  GET_ID_MISSING: "player_profile_get_id_missing",
  GET_FAILED: "player_profile_get_failed",
  GET_BY_PLAYER_ID_MISSING: "player_profile_get_by_player_id_missing",
  GET_BY_PLAYER_FAILED: "player_profile_get_by_player_failed",
  GET_BY_SLUG_MISSING: "player_profile_get_by_slug_missing",
  GET_BY_SLUG_FAILED: "player_profile_get_by_slug_failed",
  CREATE_VALIDATION_FAILED: "player_profile_create_validation_failed",
  CREATE_ALREADY_EXISTS: "player_profile_create_already_exists",
  CREATE_FAILED: "player_profile_create_failed",
  UPDATE_ID_MISSING: "player_profile_update_id_missing",
  UPDATE_VALIDATION_FAILED: "player_profile_update_validation_failed",
  UPDATE_FAILED: "player_profile_update_failed",
  DELETE_ID_MISSING: "player_profile_delete_id_missing",
  DELETE_FAILED: "player_profile_delete_failed",
} as const;

export const PlayerProfileUseCaseMessage = {
  ID_REQUIRED: "Profile ID is required",
  PLAYER_ID_REQUIRED: "Player ID is required",
  SLUG_REQUIRED: "Profile slug is required",
  ALREADY_EXISTS: "A profile already exists for this player",
} as const;
