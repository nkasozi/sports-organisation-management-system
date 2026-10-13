export const PLAYER_TEAM_MEMBERSHIP_USE_CASES_LOG_SCOPE =
  "[PlayerTeamMembershipUseCases]";

export const PlayerTeamMembershipUseCaseEvent = {
  LIST_FAILED: "player_team_membership_list_failed",
  GET_ID_MISSING: "player_team_membership_get_id_missing",
  GET_FAILED: "player_team_membership_get_failed",
  CREATE_VALIDATION_FAILED: "player_team_membership_create_validation_failed",
  CREATE_FAILED: "player_team_membership_create_failed",
  UPDATE_ID_MISSING: "player_team_membership_update_id_missing",
  UPDATE_FAILED: "player_team_membership_update_failed",
  DELETE_ID_MISSING: "player_team_membership_delete_id_missing",
  DELETE_FAILED: "player_team_membership_delete_failed",
  LIST_BY_TEAM_ID_MISSING: "player_team_membership_list_by_team_id_missing",
  LIST_BY_TEAM_FAILED: "player_team_membership_list_by_team_failed",
  LIST_BY_PLAYER_ID_MISSING: "player_team_membership_list_by_player_id_missing",
  LIST_BY_PLAYER_FAILED: "player_team_membership_list_by_player_failed",
  BULK_DELETE_IDS_MISSING: "player_team_membership_bulk_delete_ids_missing",
  BULK_DELETE_FAILED: "player_team_membership_bulk_delete_failed",
  ACTIVE_LOOKUP_FAILED: "player_team_membership_active_lookup_failed",
  ALREADY_ACTIVE_ELSEWHERE: "player_team_membership_already_active_elsewhere",
} as const;

export const PlayerTeamMembershipUseCaseMessage = {
  ID_REQUIRED: "Membership ID is required",
  IDS_REQUIRED: "At least one membership ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
  PLAYER_ID_REQUIRED: "Player ID is required",
  ALREADY_ACTIVE_ELSEWHERE:
    "This player is already active on a team. Record a transfer or end the current membership before adding a new active one.",
} as const;
