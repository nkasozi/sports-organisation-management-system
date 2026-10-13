export const COMPETITION_TEAM_LOG_SCOPE = "[CompetitionTeamUseCases]";

export const COMPETITION_TEAM_EVENT = {
  ID_MISSING: "competition_team_id_missing",
  COMPETITION_ID_MISSING: "competition_team_competition_id_missing",
  TEAM_ID_MISSING: "competition_team_team_id_missing",
  MEMBERSHIP_IDS_MISSING: "competition_team_membership_ids_missing",
  VALIDATION_FAILED: "competition_team_validation_failed",
  ALREADY_REGISTERED: "competition_team_already_registered",
  LIST_FAILED: "competition_team_list_failed",
  LOOKUP_FAILED: "competition_team_lookup_failed",
  CREATE_FAILED: "competition_team_create_failed",
  UPDATE_FAILED: "competition_team_update_failed",
  DELETE_FAILED: "competition_team_delete_failed",
  REMOVE_FAILED: "competition_team_remove_failed",
} as const;

export const COMPETITION_TEAM_MESSAGE = {
  ID_REQUIRED: "Competition team ID is required",
  COMPETITION_ID_REQUIRED: "Competition ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
  MEMBERSHIP_IDS_REQUIRED: "Both competition ID and team ID are required",
  ALREADY_REGISTERED: "Team is already registered in this competition",
} as const;
