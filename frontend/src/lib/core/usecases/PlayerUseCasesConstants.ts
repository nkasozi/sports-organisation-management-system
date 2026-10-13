export const PLAYER_USE_CASES_LOG_SCOPE = "[PlayerUseCases]";

export const PlayerUseCaseEvent = {
  LIST_FAILED: "player_list_failed",
  GET_ID_MISSING: "player_get_id_missing",
  GET_FAILED: "player_get_failed",
  CREATE_VALIDATION_FAILED: "player_create_validation_failed",
  CREATE_FAILED: "player_create_failed",
  UPDATE_ID_MISSING: "player_update_id_missing",
  UPDATE_FAILED: "player_update_failed",
  DELETE_ID_MISSING: "player_delete_id_missing",
  DELETE_FAILED: "player_delete_failed",
  BULK_DELETE_IDS_MISSING: "player_bulk_delete_ids_missing",
  BULK_DELETE_FAILED: "player_bulk_delete_failed",
  LIST_BY_TEAM_ID_MISSING: "player_list_by_team_id_missing",
  LIST_BY_TEAM_FAILED: "player_list_by_team_failed",
} as const;

export const PlayerUseCaseMessage = {
  ID_REQUIRED: "Player ID is required",
  IDS_REQUIRED: "At least one player ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
} as const;
